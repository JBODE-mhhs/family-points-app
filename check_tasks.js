// Simple script to check localStorage tasks
const data = localStorage.getItem('family-points-household');
if (data) {
  const household = JSON.parse(data);
  console.log('Baseline Tasks:', household.settings.baselineTasks);
  console.log('Extra Tasks:', household.settings.extraTasks);
}
