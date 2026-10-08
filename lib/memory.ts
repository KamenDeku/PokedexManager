import { prisma } from "@/lib/prisma";

const MAX_MEMORIES = 30;
const MAX_MEMORY_LENGTH = 300;

export type MemoryCategoryValue = "PREFERENCE" | "FACT";

export interface UserMemoryItem {
  id: number;
  category: MemoryCategoryValue;
  content: string;
}

export async function getUserMemories(userId: number): Promise<UserMemoryItem[]> {
  return prisma.userMemory.findMany({
    where: { userId },
    orderBy: { id: "asc" },
    select: {
      id: true,
      category: true,
      content: true,
    },
  });
}

export async function saveUserMemory(userId: number, content: string, category: MemoryCategoryValue = "FACT") {
  const text = content.trim().slice(0, MAX_MEMORY_LENGTH);

  if (!text) {
    return { error: "memory es requerido" };
  }

  const safeCategory: MemoryCategoryValue = category === "PREFERENCE" ? "PREFERENCE" : "FACT";
  const existing = await getUserMemories(userId);
  const duplicated = existing.some(
    (item) => item.content.toLowerCase() === text.toLowerCase()
  );

  if (duplicated) {
    return { saved: false, reason: "Ya estaba guardado" };
  }

  if (existing.length >= MAX_MEMORIES) {
    return {
      error: "La memoria esta llena. Usa forget_memory para borrar algo menos importante antes de guardar.",
    };
  }

  const created = await prisma.userMemory.create({
    data: { userId, category: safeCategory, content: text },
    select: { id: true, category: true, content: true },
  });

  return { saved: true, memory: created };
}

export async function deleteUserMemory(userId: number, id: number) {
  const result = await prisma.userMemory.deleteMany({
    where: { id, userId },
  });

  return { deleted: result.count > 0 };
}

export async function clearUserMemories(userId: number) {
  await prisma.userMemory.deleteMany({
    where: { userId },
  });
}