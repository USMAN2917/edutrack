-- ================================================================
-- EduTrack Database Schema
-- Run this entire file in Supabase SQL Editor
-- ================================================================

-- 1. PROFILES TABLE (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
  subject TEXT,        -- for teachers only
  batch TEXT,          -- for students only
  avatar_initials TEXT NOT NULL DEFAULT 'XX',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ASSIGNMENTS TABLE
CREATE TABLE public.assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL,
  due_date DATE NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SUBMISSIONS TABLE
CREATE TABLE public.submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'late')),
  submitted_at TIMESTAMPTZ,
  grade TEXT,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) - Protects your data
-- ================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read all profiles, only update their own
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- ASSIGNMENTS: Everyone can read, only teachers can create/update/delete their own
CREATE POLICY "assignments_select" ON public.assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "assignments_insert" ON public.assignments FOR INSERT TO authenticated
  WITH CHECK (
    teacher_id = auth.uid() AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'teacher'
  );
CREATE POLICY "assignments_update" ON public.assignments FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid());
CREATE POLICY "assignments_delete" ON public.assignments FOR DELETE TO authenticated
  USING (teacher_id = auth.uid());

-- SUBMISSIONS: Students see their own, teachers see all for their assignments
CREATE POLICY "submissions_select_student" ON public.submissions FOR SELECT TO authenticated
  USING (
    student_id = auth.uid() OR
    assignment_id IN (SELECT id FROM public.assignments WHERE teacher_id = auth.uid())
  );
CREATE POLICY "submissions_insert" ON public.submissions FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "submissions_update_student" ON public.submissions FOR UPDATE TO authenticated
  USING (
    student_id = auth.uid() OR
    assignment_id IN (SELECT id FROM public.assignments WHERE teacher_id = auth.uid())
  );

-- ================================================================
-- TRIGGER: Auto-create profile after signup
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, avatar_initials)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'name', 'XX'), 2))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- FUNCTION: Auto-create submissions for all students when assignment is created
-- ================================================================
CREATE OR REPLACE FUNCTION public.create_submissions_for_assignment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.submissions (assignment_id, student_id)
  SELECT NEW.id, id FROM public.profiles WHERE role = 'student';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_assignment_created
  AFTER INSERT ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.create_submissions_for_assignment();

-- ================================================================
-- SAMPLE DATA (optional - run after creating your accounts)
-- ================================================================
-- After you sign up as a teacher, run this with your teacher's UUID:
-- INSERT INTO public.assignments (title, description, subject, due_date, priority, teacher_id)
-- VALUES
--   ('Calculus Problem Set 5', 'Solve problems 1-20 from Chapter 5.', 'Mathematics', NOW() + INTERVAL '3 days', 'high', 'YOUR-TEACHER-UUID'),
--   ('Data Structures Lab', 'Implement Binary Search Tree.', 'Computer Science', NOW() + INTERVAL '5 days', 'high', 'YOUR-TEACHER-UUID'),
--   ('Literary Analysis Essay', 'Write a 1500-word analysis of The Great Gatsby.', 'English Literature', NOW() + INTERVAL '8 days', 'medium', 'YOUR-TEACHER-UUID');
