export const userRoles = [
  { value: "PROFESSOR", label: "Profesor" },
  { value: "TRAINER", label: "Entrenador" },
] as const;

export function getUserRoleLabel(role: "PROFESSOR" | "TRAINER"): string {
  return (userRoles.find((userRole) => userRole.value === role)?.label ?? role);
}
