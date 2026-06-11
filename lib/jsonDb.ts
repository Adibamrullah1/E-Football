import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

export interface Season {
  id: string;
  name: string;
  isActive: boolean;
  startDate: string | Date;
  endDate: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: any;
  matches: any;
}

export interface Player {
  id: string;
  name: string;
  username: string;
  shortName: string;
  avatarUrl: string | null;
  description: string | null;
  city: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: any;
}

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';

export interface Match {
  id: string;
  seasonId: string;
  homePlayerId: string;
  awayPlayerId: string;
  scheduledAt: string | Date;
  playedAt: string | Date | null;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  isVerified: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  homePlayer: any;
  awayPlayer: any;
  season: any;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  createdAt: string | Date;
}

// Helpers
async function readData<T>(filename: string): Promise<T[]> {
  try {
    const filePath = path.join(dataDir, filename);
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

async function writeData<T>(filename: string, data: T[]): Promise<void> {
  const filePath = path.join(dataDir, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Players
export const jsonDb = {
  player: {
    findMany: async (args?: any): Promise<Player[]> => {
      let data = await readData<Player>('players.json');
      if (args?.where) {
        for (const [key, val] of Object.entries(args.where)) {
            data = data.filter((p: any) => p[key] === val);
        }
      }
      return data as any;
    },
    findUnique: async (args: { where: { id?: string, username?: string }, include?: any }) => {
      const data = await readData<Player>('players.json');
      return data.find(p => (args.where.id && p.id === args.where.id) || (args.where.username && p.username === args.where.username)) || null;
    },
    create: async (args: { data: any }) => {
      const data = await readData<Player>('players.json');
      const newPlayer = {
        ...args.data,
        id: args.data.id || Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.push(newPlayer);
      await writeData('players.json', data);
      return newPlayer;
    },
    update: async (args: { where: { id: string }, data: any }) => {
      const data = await readData<Player>('players.json');
      const index = data.findIndex(p => p.id === args.where.id);
      if (index === -1) throw new Error("Player not found");
      data[index] = { ...data[index], ...args.data, updatedAt: new Date().toISOString() };
      await writeData('players.json', data);
      return data[index];
    },
    delete: async (args: { where: { id: string } }) => {
      let data = await readData<Player>('players.json');
      data = data.filter(p => p.id !== args.where.id);
      await writeData('players.json', data);
    },
    count: async (args?: any) => {
      const data = await readData<Player>('players.json');
      return data.length;
    }
  },
  season: {
    findMany: async (args?: any): Promise<Season[]> => {
      let data = await readData<Season>('seasons.json');
      if (args?.where) {
        for (const [key, val] of Object.entries(args.where)) {
            data = data.filter((s: any) => s[key] === val);
        }
      }
      if (args?.orderBy) {
        // Simple order by
      }
      return data;
    },
    findUnique: async (args: { where: { id: string } }) => {
      const data = await readData<Season>('seasons.json');
      return data.find(s => s.id === args.where.id) || null;
    },
    findFirst: async (args?: any) => {
      const data = await readData<Season>('seasons.json');
      let filtered = data;
      if (args?.where) {
        for (const [key, val] of Object.entries(args.where)) {
            filtered = filtered.filter((s: any) => s[key] === val);
        }
      }
      return filtered[0] || null;
    },
    create: async (args: { data: any }) => {
      const data = await readData<Season>('seasons.json');
      const newSeason = {
        ...args.data,
        id: args.data.id || Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.push(newSeason);
      await writeData('seasons.json', data);
      return newSeason;
    },
    update: async (args: { where: { id: string }, data: any }) => {
      const data = await readData<Season>('seasons.json');
      const index = data.findIndex(s => s.id === args.where.id);
      if (index === -1) throw new Error("Season not found");
      data[index] = { ...data[index], ...args.data, updatedAt: new Date().toISOString() };
      await writeData('seasons.json', data);
      return data[index];
    },
    updateMany: async (args: { where?: any, data: any }) => {
      const data = await readData<Season>('seasons.json');
      let count = 0;
      for (let i = 0; i < data.length; i++) {
         let match = true;
         if (args.where) {
             for (const [key, val] of Object.entries(args.where)) {
                 if ((data[i] as any)[key] !== val) match = false;
             }
         }
         if (match) {
             data[i] = { ...data[i], ...args.data, updatedAt: new Date().toISOString() };
             count++;
         }
      }
      await writeData('seasons.json', data);
      return { count };
    },
    delete: async (args: { where: { id: string } }) => {
      let data = await readData<Season>('seasons.json');
      data = data.filter(s => s.id !== args.where.id);
      await writeData('seasons.json', data);
    }
  },
  match: {
    findMany: async (args?: any): Promise<Match[]> => {
      let data = await readData<Match>('matches.json');
      if (args?.where) {
        for (const [key, val] of Object.entries(args.where)) {
            if (key === 'OR') {
               const orConditions = val as any[];
               data = data.filter(m => {
                   return orConditions.some(cond => {
                       for(const [k, v] of Object.entries(cond)) {
                           if ((m as any)[k] !== v) return false;
                       }
                       return true;
                   });
               });
            } else if (typeof val === 'object' && val !== null) {
               const v = val as any;
               if (v.in) {
                   data = data.filter(m => v.in.includes((m as any)[key]));
               }
            } else {
               data = data.filter((m: any) => m[key] === val);
            }
        }
      }
      if (args?.orderBy) {
        if (args.orderBy.scheduledAt) {
            data.sort((a, b) => {
                const d1 = new Date(a.scheduledAt).getTime();
                const d2 = new Date(b.scheduledAt).getTime();
                return args.orderBy.scheduledAt === 'desc' ? d2 - d1 : d1 - d2;
            });
        }
      }
      if (args?.include) {
         const players = await readData<Player>('players.json');
         const seasons = await readData<Season>('seasons.json');
         data = data.map(m => {
            const extra: any = { ...m };
            if (args.include.homePlayer) extra.homePlayer = players.find(p => p.id === m.homePlayerId);
            if (args.include.awayPlayer) extra.awayPlayer = players.find(p => p.id === m.awayPlayerId);
            if (args.include.season) extra.season = seasons.find(s => s.id === m.seasonId);
            return extra;
         });
      }
      if (args?.take) {
         data = data.slice(0, args.take);
      }
      return data;
    },
    findUnique: async (args: { where: { id: string }, include?: any }) => {
      const data = await readData<Match>('matches.json');
      const match = data.find(m => m.id === args.where.id) || null;
      if (match && args.include) {
         const players = await readData<Player>('players.json');
         const seasons = await readData<Season>('seasons.json');
         const extra: any = { ...match };
         if (args.include.homePlayer) extra.homePlayer = players.find(p => p.id === match.homePlayerId);
         if (args.include.awayPlayer) extra.awayPlayer = players.find(p => p.id === match.awayPlayerId);
         if (args.include.season) extra.season = seasons.find(s => s.id === match.seasonId);
         return extra;
      }
      return match;
    },
    create: async (args: { data: any, include?: any }) => {
      const data = await readData<Match>('matches.json');
      const newMatch = {
        ...args.data,
        id: args.data.id || Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.push(newMatch);
      await writeData('matches.json', data);
      
      if (args.include) {
         const players = await readData<Player>('players.json');
         const seasons = await readData<Season>('seasons.json');
         const extra: any = { ...newMatch };
         if (args.include.homePlayer) extra.homePlayer = players.find(p => p.id === newMatch.homePlayerId);
         if (args.include.awayPlayer) extra.awayPlayer = players.find(p => p.id === newMatch.awayPlayerId);
         if (args.include.season) extra.season = seasons.find(s => s.id === newMatch.seasonId);
         return extra;
      }
      return newMatch as any;
    },
    update: async (args: { where: { id: string }, data: any, include?: any }) => {
      const data = await readData<Match>('matches.json');
      const index = data.findIndex(m => m.id === args.where.id);
      if (index === -1) throw new Error("Match not found");
      data[index] = { ...data[index], ...args.data, updatedAt: new Date().toISOString() };
      await writeData('matches.json', data);
      
      if (args.include) {
         const players = await readData<Player>('players.json');
         const seasons = await readData<Season>('seasons.json');
         const extra: any = { ...data[index] };
         if (args.include.homePlayer) extra.homePlayer = players.find(p => p.id === data[index].homePlayerId);
         if (args.include.awayPlayer) extra.awayPlayer = players.find(p => p.id === data[index].awayPlayerId);
         if (args.include.season) extra.season = seasons.find(s => s.id === data[index].seasonId);
         return extra;
      }
      return data[index] as any;
    },
    delete: async (args: { where: { id: string } }) => {
      let data = await readData<Match>('matches.json');
      data = data.filter(m => m.id !== args.where.id);
      await writeData('matches.json', data);
    },
    deleteMany: async (args: { where: any }) => {
      let data = await readData<Match>('matches.json');
      const initialLength = data.length;
      if (args.where) {
          for (const [key, val] of Object.entries(args.where)) {
              if (key === 'OR') {
                 const orConditions = val as any[];
                 data = data.filter(m => {
                     return !orConditions.some(cond => {
                         for(const [k, v] of Object.entries(cond)) {
                             if ((m as any)[k] !== v) return false;
                         }
                         return true;
                     });
                 });
              } else {
                 data = data.filter((m: any) => m[key] !== val);
              }
          }
      } else {
          data = [];
      }
      await writeData('matches.json', data);
      return { count: initialLength - data.length };
    },
    count: async (args?: any) => {
      const data = await readData<Match>('matches.json');
      return data.length;
    }
  },
  user: {
    findUnique: async (args: { where: { username: string } }) => {
      const data = await readData<User>('users.json');
      return data.find(u => u.username === args.where.username) || null;
    }
  },
  $transaction: async (queries: any[] | ((tx: any) => Promise<any>)) => {
      // Very naive implementation. We assume the queries are promises that resolve.
      // This is risky in real code, but fine for local JSON mock if they are standard promises.
      // Actually, Prisma transaction expects an array of unresolved Prisma promises or a callback.
      if (typeof queries === 'function') {
          // It's a transaction callback
          return await (queries as any)(jsonDb);
      } else {
          return await Promise.all(queries);
      }
  },
  $queryRaw: async (query: any) => {
    return [{ 1: 1 }];
  },
  $disconnect: async () => {},
  $connect: async () => {},
};
