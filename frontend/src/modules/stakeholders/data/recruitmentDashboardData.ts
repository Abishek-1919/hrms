import type { RecruitmentRecord } from "@/modules/stakeholders/utils/recruitmentAnalytics";

const teamDirectory = [
  {
    country: "India",
    teamName: "Team India",
    recruiterPresident: "Aarav Mehta",
    recruiterVicePresident: "Priya Nair",
    recruiters: ["Riya Sharma", "Arjun Rao", "Meera Iyer", "Kabir Singh", "Nisha Kapoor", "Dev Patel"]
  },
  {
    country: "USA",
    teamName: "Team USA",
    recruiterPresident: "Olivia Bennett",
    recruiterVicePresident: "Ethan Carter",
    recruiters: ["Ava Thompson", "Noah Brooks", "Mia Reynolds", "Liam Parker", "Sophia Hayes", "Lucas Morgan"]
  },
  {
    country: "Canada",
    teamName: "Team Canada",
    recruiterPresident: "Charlotte Wilson",
    recruiterVicePresident: "Benjamin Scott",
    recruiters: ["Emma Clarke", "Logan Price", "Grace Miller", "Henry Foster", "Amelia Ross", "Mason King"]
  },
  {
    country: "Thailand",
    teamName: "Team Thailand",
    recruiterPresident: "Anong Srisai",
    recruiterVicePresident: "Kiet Charoen",
    recruiters: ["Mali Wattan", "Niran Kovit", "Ploy Intara", "Somsak Arun", "Kanya Prasert", "Tanin Chai"]
  }
];

const clientProjects = [
  { clientName: "Acme Cloud", projectName: "Cloud Platform Expansion" },
  { clientName: "Nexora Bank", projectName: "Digital Banking Pods" },
  { clientName: "Helio Health", projectName: "Care Analytics" },
  { clientName: "Orion Retail", projectName: "Commerce Modernization" },
  { clientName: "Vector Energy", projectName: "Grid Operations" }
];

const stageSequence = [
  "Pre-Screen Rejected",
  "Pre-Screen Selected",
  "Interview Scheduled",
  "Interview Selected",
  "Client Submission",
  "Offer Released",
  "Joined",
  "Dropped"
] as const;

const monthStarts = ["2026-01-06", "2026-02-04", "2026-03-05", "2026-04-03", "2026-05-05", "2026-06-04"];

function addDays(dateText: string, days: number) {
  const date = new Date(`${dateText}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function blankAfter(recordDate: string | undefined, include: boolean) {
  return include ? recordDate : undefined;
}

export const recruitmentDashboardData: RecruitmentRecord[] = teamDirectory.flatMap((team, teamIndex) =>
  team.recruiters.flatMap((recruiterName, recruiterIndex) =>
    monthStarts.flatMap((monthStart, monthIndex) => {
      const profileCount = 3 + ((teamIndex + recruiterIndex + monthIndex) % 4);

      return Array.from({ length: profileCount }, (_, profileIndex) => {
        const sequenceIndex = (teamIndex * 5 + recruiterIndex * 3 + monthIndex + profileIndex) % stageSequence.length;
        const currentStage = stageSequence[sequenceIndex];
        const clientProject = clientProjects[(teamIndex + recruiterIndex + profileIndex + monthIndex) % clientProjects.length];
        const profileSourcedDate = addDays(monthStart, recruiterIndex + profileIndex * 2);
        const preScreenSelected = !["Pre-Screen Rejected"].includes(currentStage);
        const interviewScheduled = ["Interview Scheduled", "Interview Selected", "Client Submission", "Offer Released", "Joined", "Dropped"].includes(currentStage);
        const interviewSelected = ["Interview Selected", "Client Submission", "Offer Released", "Joined"].includes(currentStage);
        const clientSubmitted = ["Client Submission", "Offer Released", "Joined"].includes(currentStage);
        const offerReleased = ["Offer Released", "Joined"].includes(currentStage);
        const joined = currentStage === "Joined";
        const dropped = currentStage === "Dropped";

        return {
          id: `recruitment-${team.teamName.toLowerCase().replace(/\s+/g, "-")}-${recruiterIndex + 1}-${monthIndex + 1}-${profileIndex + 1}`,
          country: team.country,
          teamName: team.teamName,
          recruiterPresident: team.recruiterPresident,
          recruiterVicePresident: team.recruiterVicePresident,
          recruiterName,
          clientName: clientProject.clientName,
          projectName: clientProject.projectName,
          profileSourcedDate,
          preScreenStatus: preScreenSelected ? "Selected" : "Rejected",
          preScreenSelectedDate: blankAfter(addDays(profileSourcedDate, 2), preScreenSelected),
          interviewScheduledDate: blankAfter(addDays(profileSourcedDate, 5), interviewScheduled),
          interviewSelectedDate: blankAfter(addDays(profileSourcedDate, 9), interviewSelected),
          clientSubmissionDate: blankAfter(addDays(profileSourcedDate, 12), clientSubmitted),
          offerReleasedDate: blankAfter(addDays(profileSourcedDate, 18), offerReleased),
          joinedDate: blankAfter(addDays(profileSourcedDate, 30), joined),
          currentStage,
          finalStatus: joined ? "Joined" : dropped ? "Dropped" : currentStage === "Pre-Screen Rejected" ? "Rejected" : "In Progress",
          rejectionReason: currentStage === "Pre-Screen Rejected" ? "Skill mismatch" : undefined,
          dropoutReason: dropped ? "Candidate unavailable" : undefined,
          remarks: `${clientProject.projectName} pipeline for ${team.teamName}`
        };
      });
    })
  )
);
