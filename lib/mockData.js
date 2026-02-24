// Mock data for MeditationDashboard when real Oura data is not available

function generateMockDay(dateStr, index) {
      const seed = index + 1;
      return {
              date: dateStr,
              sleepScore: 70 + Math.round(Math.sin(seed) * 15),
              readinessScore: 72 + Math.round(Math.cos(seed) * 12),
              stressBalance: Math.round(Math.sin(seed * 0.7) * 30),
              hrvAvg: 45 + Math.round(Math.sin(seed * 1.3) * 15),
              restingHR: 52 + Math.round(Math.cos(seed * 0.9) * 6),
              sleepDurationMin: 420 + Math.round(Math.sin(seed * 1.1) * 60),
              deepSleepMin: 80 + Math.round(Math.sin(seed * 1.5) * 30),
              remSleepMin: 100 + Math.round(Math.cos(seed * 1.2) * 25),
              sessionData: index % 3 === 0 ? [] : [
                  {
                              type: "meditation",
                              startTime: dateStr + "T06:30:00",
                              durationMin: 20 + (index % 10),
                              heartRateAvg: 58 + (index % 8),
                              heartRateMin: 52 + (index % 5),
                              hrvAvg: 55 + (index % 12),
                              settleTimeMin: 3 + (index % 4),
                              hrvSamples: Array.from({ length: 10 }, (_, i) => ({
                                            time: i * 2,
                                            hrv: 50 + Math.round(Math.sin(i + seed) * 10),
                              })),
                              hrSamples: Array.from({ length: 10 }, (_, i) => ({
                                            time: i * 2,
                                            hr: 60 + Math.round(Math.cos(i + seed) * 5),
                              })),
                  },
                      ],
      };
}

export function generateMockData(days = 30) {
      const data = [];
      const today = new Date();
      for (let i = days - 1; i >= 0; i--) {
              const d = new Date(today);
              d.setDate(d.getDate() - i);
              const dateStr = d.toISOString().split("T")[0];
              data.push(generateMockDay(dateStr, i));
      }
      return data;
}

export const mockData = generateMockData(30);
export default mockData;
