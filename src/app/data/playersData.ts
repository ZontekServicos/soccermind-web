export interface PlayerStats {
  // Attacking
  crossing: number;
  finishing: number;
  headingAccuracy: number;
  shortPassing: number;
  volleys: number;
  
  // Skill
  dribbling: number;
  curve: number;
  fkAccuracy: number;
  longPassing: number;
  ballControl: number;
  
  // Movement
  acceleration: number;
  sprintSpeed: number;
  agility: number;
  reactions: number;
  balance: number;
  
  // Power
  shotPower: number;
  jumping: number;
  stamina: number;
  strength: number;
  longShots: number;
  
  // Mentality
  aggression: number;
  interceptions: number;
  attackPosition: number;
  vision: number;
  penalties: number;
  composure: number;
  
  // Defending
  defensiveAwareness: number;
  standingTackle: number;
  slidingTackle: number;
  
  // Goalkeeping
  gkDiving: number;
  gkHandling: number;
  gkKicking: number;
  gkPositioning: number;
  gkReflexes: number;
}

export interface Player {
  id: string;
  name: string;
  age: number;
  position: string;
  nationality: string;
  club: string;
  overall: number;
  potential: number;
  marketValue: string;
  stats: PlayerStats;
  playStyles: string[];
  // Radar chart stats
  pac: number; // Pace
  sho: number; // Shooting
  pas: number; // Passing
  dri: number; // Dribbling
  def: number; // Defending
  phy: number; // Physical
}

export const playersData: Player[] = [
  {
    id: "1",
    name: "Gabriel Silva",
    age: 24,
    position: "ST",
    nationality: "Brasil",
    club: "Flamengo",
    overall: 85,
    potential: 92,
    marketValue: "€45M",
    pac: 90,
    sho: 67,
    pas: 69,
    dri: 82,
    def: 64,
    phy: 69,
    playStyles: ["Gamechanger", "Rapid", "Relentless"],
    stats: {
      crossing: 71,
      finishing: 66,
      headingAccuracy: 50,
      shortPassing: 72,
      volleys: 58,
      dribbling: 84,
      curve: 74,
      fkAccuracy: 49,
      longPassing: 61,
      ballControl: 79,
      acceleration: 88,
      sprintSpeed: 92,
      agility: 85,
      reactions: 74,
      balance: 84,
      shotPower: 70,
      jumping: 72,
      stamina: 85,
      strength: 62,
      longShots: 68,
      aggression: 65,
      interceptions: 70,
      attackPosition: 73,
      vision: 70,
      penalties: 60,
      composure: 77,
      defensiveAwareness: 63,
      standingTackle: 66,
      slidingTackle: 62,
      gkDiving: 9,
      gkHandling: 11,
      gkKicking: 6,
      gkPositioning: 8,
      gkReflexes: 13,
    },
  },
  {
    id: "2",
    name: "Lucas Martins",
    age: 22,
    position: "CAM",
    nationality: "Brasil",
    club: "Palmeiras",
    overall: 83,
    potential: 89,
    marketValue: "€38M",
    pac: 75,
    sho: 78,
    pas: 85,
    dri: 88,
    def: 52,
    phy: 65,
    playStyles: ["Gamechanger", "Rapid"],
    stats: {
      crossing: 82,
      finishing: 75,
      headingAccuracy: 48,
      shortPassing: 87,
      volleys: 72,
      dribbling: 90,
      curve: 85,
      fkAccuracy: 79,
      longPassing: 84,
      ballControl: 92,
      acceleration: 78,
      sprintSpeed: 72,
      agility: 90,
      reactions: 82,
      balance: 88,
      shotPower: 76,
      jumping: 65,
      stamina: 78,
      strength: 58,
      longShots: 80,
      aggression: 48,
      interceptions: 55,
      attackPosition: 82,
      vision: 88,
      penalties: 74,
      composure: 85,
      defensiveAwareness: 50,
      standingTackle: 52,
      slidingTackle: 48,
      gkDiving: 8,
      gkHandling: 10,
      gkKicking: 7,
      gkPositioning: 9,
      gkReflexes: 11,
    },
  },
  {
    id: "3",
    name: "Rafael Costa",
    age: 26,
    position: "CB",
    nationality: "Brasil",
    club: "São Paulo",
    overall: 82,
    potential: 85,
    marketValue: "€25M",
    pac: 68,
    sho: 45,
    pas: 62,
    dri: 58,
    def: 88,
    phy: 85,
    playStyles: ["Relentless"],
    stats: {
      crossing: 42,
      finishing: 38,
      headingAccuracy: 82,
      shortPassing: 65,
      volleys: 35,
      dribbling: 55,
      curve: 48,
      fkAccuracy: 52,
      longPassing: 68,
      ballControl: 62,
      acceleration: 65,
      sprintSpeed: 71,
      agility: 62,
      reactions: 78,
      balance: 68,
      shotPower: 58,
      jumping: 85,
      stamina: 82,
      strength: 88,
      longShots: 42,
      aggression: 78,
      interceptions: 85,
      attackPosition: 32,
      vision: 62,
      penalties: 45,
      composure: 82,
      defensiveAwareness: 88,
      standingTackle: 86,
      slidingTackle: 84,
      gkDiving: 12,
      gkHandling: 14,
      gkKicking: 10,
      gkPositioning: 11,
      gkReflexes: 15,
    },
  },
  {
    id: "4",
    name: "Matheus Ferreira",
    age: 21,
    position: "RW",
    nationality: "Brasil",
    club: "Corinthians",
    overall: 81,
    potential: 88,
    marketValue: "€32M",
    pac: 92,
    sho: 74,
    pas: 76,
    dri: 86,
    def: 42,
    phy: 62,
    playStyles: ["Rapid", "Gamechanger"],
    stats: {
      crossing: 78,
      finishing: 72,
      headingAccuracy: 42,
      shortPassing: 75,
      volleys: 68,
      dribbling: 88,
      curve: 80,
      fkAccuracy: 65,
      longPassing: 72,
      ballControl: 85,
      acceleration: 94,
      sprintSpeed: 95,
      agility: 92,
      reactions: 80,
      balance: 85,
      shotPower: 72,
      jumping: 68,
      stamina: 82,
      strength: 55,
      longShots: 76,
      aggression: 52,
      interceptions: 45,
      attackPosition: 78,
      vision: 74,
      penalties: 62,
      composure: 72,
      defensiveAwareness: 38,
      standingTackle: 42,
      slidingTackle: 40,
      gkDiving: 7,
      gkHandling: 9,
      gkKicking: 8,
      gkPositioning: 6,
      gkReflexes: 10,
    },
  },
  {
    id: "5",
    name: "Bruno Alves",
    age: 28,
    position: "CDM",
    nationality: "Brasil",
    club: "Atlético Mineiro",
    overall: 84,
    potential: 86,
    marketValue: "€28M",
    pac: 65,
    sho: 58,
    pas: 78,
    dri: 72,
    def: 82,
    phy: 80,
    playStyles: ["Relentless"],
    stats: {
      crossing: 58,
      finishing: 52,
      headingAccuracy: 68,
      shortPassing: 80,
      volleys: 55,
      dribbling: 70,
      curve: 62,
      fkAccuracy: 68,
      longPassing: 82,
      ballControl: 75,
      acceleration: 62,
      sprintSpeed: 68,
      agility: 70,
      reactions: 78,
      balance: 72,
      shotPower: 65,
      jumping: 75,
      stamina: 85,
      strength: 82,
      longShots: 70,
      aggression: 75,
      interceptions: 85,
      attackPosition: 52,
      vision: 78,
      penalties: 58,
      composure: 80,
      defensiveAwareness: 84,
      standingTackle: 82,
      slidingTackle: 80,
      gkDiving: 10,
      gkHandling: 12,
      gkKicking: 9,
      gkPositioning: 10,
      gkReflexes: 13,
    },
  },
  {
    id: "6",
    name: "Pedro Santos",
    age: 25,
    position: "LB",
    nationality: "Brasil",
    club: "Internacional",
    overall: 80,
    potential: 84,
    marketValue: "€22M",
    pac: 82,
    sho: 52,
    pas: 74,
    dri: 75,
    def: 78,
    phy: 76,
    playStyles: ["Rapid"],
    stats: {
      crossing: 76,
      finishing: 48,
      headingAccuracy: 58,
      shortPassing: 76,
      volleys: 52,
      dribbling: 78,
      curve: 68,
      fkAccuracy: 62,
      longPassing: 74,
      ballControl: 76,
      acceleration: 85,
      sprintSpeed: 88,
      agility: 82,
      reactions: 76,
      balance: 80,
      shotPower: 58,
      jumping: 72,
      stamina: 88,
      strength: 70,
      longShots: 55,
      aggression: 68,
      interceptions: 75,
      attackPosition: 65,
      vision: 72,
      penalties: 50,
      composure: 74,
      defensiveAwareness: 76,
      standingTackle: 78,
      slidingTackle: 76,
      gkDiving: 8,
      gkHandling: 10,
      gkKicking: 7,
      gkPositioning: 9,
      gkReflexes: 11,
    },
  },
];
