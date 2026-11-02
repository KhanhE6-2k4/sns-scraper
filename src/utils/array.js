// Chia mảng thành min(maxGroups, items.length) nhóm, xếp xoay vòng để các nhóm chênh nhau tối đa 1 phần tử.
// vd: splitIntoGroups([1..7], 5) -> [[1,6], [2,7], [3], [4], [5]]
export function splitIntoGroups(items, maxGroups) {
  const groupCount = Math.min(maxGroups, items.length);
  const groups = Array.from({ length: groupCount }, () => []);

  items.forEach((item, index) => {
    groups[index % groupCount].push(item);
  });

  return groups;
}

// Chạy task(group) song song cho từng nhóm và gộp kết quả (task trả về mảng).
export async function runInGroups(items, maxGroups, task) {
  const results = await Promise.all(
    splitIntoGroups(items, maxGroups).map(task)
  );

  return results.flat();
}
