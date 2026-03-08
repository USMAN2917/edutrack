const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create Teachers
  const teacher1 = await prisma.user.create({
    data: {
      name: "Dr. Kavita Rao",
      email: "kavita@college.edu",
      password: hashedPassword,
      role: "TEACHER",
      avatar: "KR",
      subject: "Mathematics",
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      name: "Prof. Suresh Nair",
      email: "suresh@college.edu",
      password: hashedPassword,
      role: "TEACHER",
      avatar: "SN",
      subject: "Computer Science",
    },
  });

  // Create Students
  const student1 = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "priya@college.edu",
      password: hashedPassword,
      role: "STUDENT",
      avatar: "PS",
      batch: "2024",
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: "Arjun Mehta",
      email: "arjun@college.edu",
      password: hashedPassword,
      role: "STUDENT",
      avatar: "AM",
      batch: "2024",
    },
  });

  const student3 = await prisma.user.create({
    data: {
      name: "Neha Patel",
      email: "neha@college.edu",
      password: hashedPassword,
      role: "STUDENT",
      avatar: "NP",
      batch: "2023",
    },
  });

  const student4 = await prisma.user.create({
    data: {
      name: "Rohan Das",
      email: "rohan@college.edu",
      password: hashedPassword,
      role: "STUDENT",
      avatar: "RD",
      batch: "2024",
    },
  });

  const allStudents = [student1, student2, student3, student4];

  // Create Assignments
  const assignments = [
    {
      title: "Calculus Problem Set 5",
      subject: "Mathematics",
      description: "Solve problems 1-20 from Chapter 5. Show all working steps clearly.",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      priority: "HIGH",
      teacherId: teacher1.id,
    },
    {
      title: "Data Structures Lab Report",
      subject: "Computer Science",
      description: "Implement Binary Search Tree and document time complexity analysis.",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      priority: "HIGH",
      teacherId: teacher2.id,
    },
    {
      title: "Literary Analysis Essay",
      subject: "English Literature",
      description: "Write a 1500-word analysis of themes in 'The Great Gatsby'. APA format required.",
      dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      priority: "MEDIUM",
      teacherId: teacher1.id,
    },
    {
      title: "Quantum Mechanics Quiz Prep",
      subject: "Physics",
      description: "Review chapters 8-10 and complete the practice worksheet attached.",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      priority: "MEDIUM",
      teacherId: teacher1.id,
    },
    {
      title: "Organic Chemistry Lab",
      subject: "Chemistry",
      description: "Complete the titration experiment and submit lab report with full data analysis.",
      dueDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
      priority: "LOW",
      teacherId: teacher2.id,
    },
  ];

  for (const assignmentData of assignments) {
    const assignment = await prisma.assignment.create({ data: assignmentData });

    // Create submissions for all students
    for (const student of allStudents) {
      await prisma.submission.create({
        data: {
          assignmentId: assignment.id,
          studentId: student.id,
          status: "PENDING",
        },
      });
    }
  }

  console.log("✅ Database seeded successfully!");
  console.log("\n📧 Login credentials (password: password123):");
  console.log("  Teachers: kavita@college.edu | suresh@college.edu");
  console.log("  Students: priya@college.edu | arjun@college.edu | neha@college.edu | rohan@college.edu");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
