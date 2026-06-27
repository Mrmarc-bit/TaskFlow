import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL || 'mysql://root:rootpassword@localhost:3306/taskflow';
const adapter = new PrismaMariaDb(databaseUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // Idempotency: Clear existing user data records before seeding
  console.log('Clearing tasks, categories, and logs...');
  await prisma.activityLog.deleteMany({});
  await prisma.taskCategory.deleteMany({});
  await prisma.taskTag.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.tag.deleteMany({});

  // 1. Define Permissions
  const permissionsData = [
    { name: 'users:manage', description: 'Manage users, roles, and permissions' },
    { name: 'tasks:create', description: 'Create tasks' },
    { name: 'tasks:read', description: 'Read tasks and their details' },
    { name: 'tasks:update', description: 'Modify tasks' },
    { name: 'tasks:delete', description: 'Permanently or soft delete tasks' },
    { name: 'categories:manage', description: 'Manage categories' },
    { name: 'tags:manage', description: 'Manage tags' },
    { name: 'comments:create', description: 'Post comments on tasks' },
    { name: 'comments:delete', description: 'Delete comments on tasks' },
    { name: 'attachments:upload', description: 'Upload task attachments' },
    { name: 'attachments:delete', description: 'Remove task attachments' },
  ];

  console.log('Creating permissions...');
  const permissionsMap: { [key: string]: any } = {};
  for (const perm of permissionsData) {
    const createdPerm = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    permissionsMap[perm.name] = createdPerm;
  }

  // 2. Define Roles
  const rolesData = [
    { name: 'ADMIN', description: 'System Administrator with full access' },
    { name: 'MEMBER', description: 'Standard user who can collaborate and manage tasks' },
    { name: 'VIEWER', description: 'Read-only user who can only view tasks' },
  ];

  console.log('Creating roles...');
  const rolesMap: { [key: string]: any } = {};
  for (const role of rolesData) {
    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
    rolesMap[role.name] = createdRole;
  }

  // 3. Define Role Permissions
  console.log('Linking roles and permissions...');
  
  // Admin permissions: all of them
  for (const permName of Object.keys(permissionsMap)) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: rolesMap['ADMIN'].id,
          permissionId: permissionsMap[permName].id,
        },
      },
      update: {},
      create: {
        roleId: rolesMap['ADMIN'].id,
        permissionId: permissionsMap[permName].id,
      },
    });
  }

  // Member permissions: all except users:manage
  const memberPerms = Object.keys(permissionsMap).filter(
    (name) => name !== 'users:manage'
  );
  for (const permName of memberPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: rolesMap['MEMBER'].id,
          permissionId: permissionsMap[permName].id,
        },
      },
      update: {},
      create: {
        roleId: rolesMap['MEMBER'].id,
        permissionId: permissionsMap[permName].id,
      },
    });
  }

  // Viewer permissions: read-only tasks
  const viewerPerms = ['tasks:read'];
  for (const permName of viewerPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: rolesMap['VIEWER'].id,
          permissionId: permissionsMap[permName].id,
        },
      },
      update: {},
      create: {
        roleId: rolesMap['VIEWER'].id,
        permissionId: permissionsMap[permName].id,
      },
    });
  }

  // 4. Create Default Users
  console.log('Creating default users...');
  const saltRounds = 10;
  
  const usersData = [
    {
      email: 'admin@taskflow.dev',
      firstName: 'Alex',
      lastName: 'Admin',
      password: 'TaskFlowAdmin123!',
      roleName: 'ADMIN',
    },
    {
      email: 'member@taskflow.dev',
      firstName: 'Sam',
      lastName: 'Member',
      password: 'TaskFlowMember123!',
      roleName: 'MEMBER',
    },
    {
      email: 'viewer@taskflow.dev',
      firstName: 'Valerie',
      lastName: 'Viewer',
      password: 'TaskFlowViewer123!',
      roleName: 'VIEWER',
    },
  ];

  for (const userData of usersData) {
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        passwordHash: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roleId: rolesMap[userData.roleName].id,
      },
    });

    // Create user settings
    await prisma.userSetting.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        theme: 'SYSTEM',
        timezone: 'UTC',
        language: 'en',
        emailNotifications: true,
        pushNotifications: true,
      },
    });
  }

  // 5. Seed Categories, Tags, Tasks and Logs for the Member
  console.log('Seeding member specific tasks and data...');
  const memberUser = await prisma.user.findUnique({
    where: { email: 'member@taskflow.dev' },
  });

  if (memberUser) {
    const userId = memberUser.id;

    // Categories
    const categoriesData = [
      { name: 'Design', color: '#ec4899', description: 'UI/UX and asset design tasks' },
      { name: 'Development', color: '#6366f1', description: 'Software programming tasks' },
      { name: 'Marketing', color: '#f59e0b', description: 'SEO and market research' },
      { name: 'Quality Assurance', color: '#10b981', description: 'Testing and vulnerabilities assessment' },
    ];

    const categoriesMap: { [key: string]: any } = {};
    for (const cat of categoriesData) {
      const createdCat = await prisma.category.upsert({
        where: { userId_name: { userId, name: cat.name } },
        update: {},
        create: {
          name: cat.name,
          color: cat.color,
          description: cat.description,
          userId,
        },
      });
      categoriesMap[cat.name] = createdCat;
    }

    // Tags
    const tagsData = [
      { name: 'Bug', color: '#f43f5e' },
      { name: 'Feature', color: '#3b82f6' },
      { name: 'Refactor', color: '#8b5cf6' },
      { name: 'Security', color: '#ef4444' },
    ];

    const tagsMap: { [key: string]: any } = {};
    for (const tag of tagsData) {
      const createdTag = await prisma.tag.upsert({
        where: { userId_name: { userId, name: tag.name } },
        update: {},
        create: {
          name: tag.name,
          color: tag.color,
          userId,
        },
      });
      tagsMap[tag.name] = createdTag;
    }

    // Tasks Data
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const tasksData = [
      {
        title: 'Design Brand Guidelines & Icons',
        description: 'Create standard logo files, brand style sheets, and SVG icons for TaskFlow.',
        status: 'DONE',
        priority: 'MEDIUM',
        progress: 100,
        completedAt: twoDaysAgo,
        deadline: now,
        creatorId: userId,
        assigneeId: userId,
        categoryName: 'Design',
        tagName: 'Feature',
      },
      {
        title: 'Setup NestJS Boilerplate & Security',
        description: 'Bootstrap backend with config validations, exception filters, helmet, CORS.',
        status: 'DONE',
        priority: 'HIGH',
        progress: 100,
        completedAt: oneDayAgo,
        deadline: oneDayAgo,
        creatorId: userId,
        assigneeId: userId,
        categoryName: 'Development',
        tagName: 'Feature',
      },
      {
        title: 'Implement JWT Session Rotation Engine',
        description: 'Code the AuthService to rotate refresh tokens and enforce reuse detection checks.',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        progress: 50,
        deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        creatorId: userId,
        assigneeId: userId,
        categoryName: 'Development',
        tagName: 'Security',
      },
      {
        title: 'Configure Workbox Service Workers',
        description: 'Integrate workbox-window and setup cache routes inside service worker registration.',
        status: 'TODO',
        priority: 'HIGH',
        progress: 0,
        deadline: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        creatorId: userId,
        assigneeId: userId,
        categoryName: 'Development',
        tagName: 'Feature',
      },
      {
        title: 'Launch Staging Deployment Docker container',
        description: 'Construct compose configuration files and test deployments on cloud container registries.',
        status: 'BACKLOG',
        priority: 'LOW',
        progress: 0,
        deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        creatorId: userId,
        assigneeId: userId,
        categoryName: 'Quality Assurance',
        tagName: 'Refactor',
      },
      {
        title: 'Run Security Vulnerability Assessment',
        description: 'Scan npm packages for critical vulnerabilities and patch outdated dependencies.',
        status: 'IN_REVIEW',
        priority: 'HIGH',
        progress: 90,
        deadline: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        creatorId: userId,
        assigneeId: userId,
        categoryName: 'Quality Assurance',
        tagName: 'Security',
      },
      {
        title: 'Review Trello/Jira Design References',
        description: 'Read the spec sheet comparing Linear and Trello UI designs for clean cards references.',
        status: 'DONE',
        priority: 'LOW',
        progress: 100,
        completedAt: fiveDaysAgo,
        deadline: fiveDaysAgo,
        creatorId: userId,
        assigneeId: userId,
        categoryName: 'Design',
        tagName: 'Refactor',
      },
    ];

    for (const t of tasksData) {
      const { categoryName, tagName, ...taskFields } = t;
      const createdTask = await prisma.task.create({
        data: {
          ...taskFields,
          taskCategories: {
            create: {
              categoryId: categoriesMap[categoryName].id,
            },
          },
          taskTags: {
            create: {
              tagId: tagsMap[tagName].id,
            },
          },
        },
      });

      // Seed mock activity logs for each task
      await prisma.activityLog.create({
        data: {
          userId,
          actionType: t.status === 'DONE' ? 'STATUS_CHANGE' : 'CREATE',
          entityType: 'TASK',
          entityId: createdTask.id,
          description: `Task '${t.title}' was ${t.status === 'DONE' ? 'marked completed' : 'created'}`,
          createdAt: t.completedAt || t.deadline || new Date(),
        },
      });
    }
  }

  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
