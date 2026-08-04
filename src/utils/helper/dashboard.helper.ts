export const getTimeBasedGreeting = (date = new Date()) => {
  const currentHour = date.getHours();

  if (currentHour < 12) return "Good morning";
  if (currentHour < 17) return "Good afternoon";

  return "Good evening";
};
