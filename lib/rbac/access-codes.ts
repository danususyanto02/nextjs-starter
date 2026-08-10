export const permissionPrefixes = ["AM", "AD", "ED", "DD"] as const;
export function generateFeatureAccessCodes(sequence: number) {
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 9999999) throw new Error("Feature sequence must be between 1 and 9999999");
  const suffix = String(sequence).padStart(7, "0");
  return permissionPrefixes.map((prefix) => `${prefix}${suffix}`);
}
