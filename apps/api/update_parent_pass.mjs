import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const p = new PrismaClient();

async function run() {
  const email = 'parent.joyjk3348@gmail.com';
  const newPassword = 'Parent@123';

  try {
    const user = await p.users.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.log(`User with email ${email} not found! Listing parent users:`);
      const parents = await p.users.findMany({
        where: { role: 'PARENT' },
        select: { id: true, email: true, firstName: true, lastName: true },
        take: 10,
      });
      console.log(parents);
      return;
    }

    console.log(`Found user: ${user.email} (id: ${user.id})`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await p.users.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    console.log(`Successfully updated password for ${user.email} to '${newPassword}'`);
  } catch (e) {
    console.error('Error updating password:', e.message);
  } finally {
    await p.$disconnect();
  }
}

run();
