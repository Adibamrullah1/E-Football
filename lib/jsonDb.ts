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

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function readData<T>(filename: string): Promise<T[]> {
  try {
    const filePath = path.join(dataDir, filename);
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeData<T>(filename: string, data: T[]): Promise<void> {
  const filePath = path.join(dataDir, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Apply a generic where clause to an array of records.
 * Supports: equality, OR[], { in: [] }, { not: val },
 *           { gte: date, lte: date }, nested objects via dot-path (future).
 */
function applyWhere<T>(data: T[], where: Record<string, any>): T[] {
  for (const [key, val] of Object.entries(where)) {
    if (key === 'AND') {
      const conditions = val as any[];
      data = data.filter(item =>
        conditions.every(cond => applyWhere([item], cond).length > 0)
      );
    } else if (key === 'OR') {
      const conditions = val as any[];
      data = data.filter(item =>
        conditions.some(cond => applyWhere([item], cond).length > 0)
      );
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      // Operator object: { in, not, gte, lte, gt, lt }
      data = data.filter(item => {
        const fieldVal = (item as any)[key];
        if ('in' in val) return (val.in as any[]).includes(fieldVal);
        if ('not' in val) return fieldVal !== val.not;
        let pass = true;
        if ('gte' in val) pass = pass && new Date(fieldVal) >= new Date(val.gte);
        if ('lte' in val) pass = pass && new Date(fieldVal) <= new Date(val.lte);
        if ('gt'  in val) pass = pass && new Date(fieldVal) >  new Date(val.gt);
        if ('lt'  in val) pass = pass && new Date(fieldVal) <  new Date(val.lt);
        return pass;
      });
    } else {
      data = data.filter((item: any) => item[key] === val);
    }
  }
  return data;
}

/** Pick only the requested keys from an object (for `select` support) */
function applySelect<T>(item: T, select: Record<string, any>): Partial<T> {
  const result: any = {};
  for (const key of Object.keys(select)) {
    if (select[key] === true || (typeof select[key] === 'object' && select[key] !== null)) {
      result[key] = (item as any)[key];
    }
  }
  return result as Partial<T>;
}

/** Attach relational data to a match record based on `include` args */
function attachMatchRelations(
  match: Match,
  include: any,
  players: Player[],
  seasons: Season[]
): any {
  const extra: any = { ...match };
  if (include?.homePlayer) {
    const hp = players.find(p => p.id === match.homePlayerId) as any;
    extra.homePlayer = include.homePlayer?.select ? applySelect(hp, include.homePlayer.select) : hp;
  }
  if (include?.awayPlayer) {
    const ap = players.find(p => p.id === match.awayPlayerId) as any;
    extra.awayPlayer = include.awayPlayer?.select ? applySelect(ap, include.awayPlayer.select) : ap;
  }
  if (include?.season) {
    extra.season = seasons.find(s => s.id === match.seasonId);
  }
  return extra;
}

// ─── Players ──────────────────────────────────────────────────────────────────

const player = {
  findMany: async (args?: any): Promise<Player[]> => {
    let data = await readData<Player>('players.json');
    if (args?.where) data = applyWhere(data, args.where);
    if (args?.orderBy) {
      const [field, dir] = Object.entries(args.orderBy)[0] as [string, string];
      data.sort((a: any, b: any) => {
        if (a[field] < b[field]) return dir === 'desc' ? 1 : -1;
        if (a[field] > b[field]) return dir === 'desc' ? -1 : 1;
        return 0;
      });
    }
    if (args?.select) {
      return data.map(p => applySelect(p, args.select)) as any;
    }
    if (args?.take) data = data.slice(0, args.take);
    return data as any;
  },

  findUnique: async (args: { where: { id?: string; username?: string }; include?: any }) => {
    const data = await readData<Player>('players.json');
    const found = data.find(p =>
      (args.where.id && p.id === args.where.id) ||
      (args.where.username && p.username === args.where.username)
    ) || null;

    if (found && args.include) {
      const extra: any = { ...found };
      // homeMatches / awayMatches — reverse relations
      if (args.include.homeMatches !== undefined) {
        const matches = await readData<Match>('matches.json');
        const players = await readData<Player>('players.json');
        let hm = matches.filter(m => m.homePlayerId === found.id);
        if (args.include.homeMatches?.orderBy?.scheduledAt) {
          const dir = args.include.homeMatches.orderBy.scheduledAt;
          hm.sort((a, b) => {
            const d = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
            return dir === 'desc' ? -d : d;
          });
        }
        if (args.include.homeMatches?.take) hm = hm.slice(0, args.include.homeMatches.take);
        if (args.include.homeMatches?.include?.awayPlayer) {
          hm = hm.map((m: any) => ({
            ...m,
            awayPlayer: players.find(p => p.id === m.awayPlayerId),
          }));
        }
        extra.homeMatches = hm;
      }
      if (args.include.awayMatches !== undefined) {
        const matches = await readData<Match>('matches.json');
        const players = await readData<Player>('players.json');
        let am = matches.filter(m => m.awayPlayerId === found.id);
        if (args.include.awayMatches?.orderBy?.scheduledAt) {
          const dir = args.include.awayMatches.orderBy.scheduledAt;
          am.sort((a, b) => {
            const d = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
            return dir === 'desc' ? -d : d;
          });
        }
        if (args.include.awayMatches?.take) am = am.slice(0, args.include.awayMatches.take);
        if (args.include.awayMatches?.include?.homePlayer) {
          am = am.map((m: any) => ({
            ...m,
            homePlayer: players.find(p => p.id === m.homePlayerId),
          }));
        }
        extra.awayMatches = am;
      }
      return extra;
    }
    return found;
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

  update: async (args: { where: { id: string }; data: any }) => {
    const data = await readData<Player>('players.json');
    const index = data.findIndex(p => p.id === args.where.id);
    if (index === -1) throw new Error('Player not found');
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
    let data = await readData<Player>('players.json');
    if (args?.where) data = applyWhere(data, args.where);
    return data.length;
  },
};

// ─── Seasons ──────────────────────────────────────────────────────────────────

const season = {
  findMany: async (args?: any): Promise<Season[]> => {
    let data = await readData<Season>('seasons.json');
    if (args?.where) data = applyWhere(data, args.where);
    if (args?.orderBy) {
      const [field, dir] = Object.entries(args.orderBy)[0] as [string, string];
      data.sort((a: any, b: any) => {
        const va = new Date(a[field]).getTime();
        const vb = new Date(b[field]).getTime();
        return dir === 'desc' ? vb - va : va - vb;
      });
    }
    if (args?.take) data = data.slice(0, args.take);

    // Support include._count.select.matches
    if (args?.include?._count?.select?.matches) {
      const matches = await readData<Match>('matches.json');
      data = data.map(s => ({
        ...s,
        _count: { matches: matches.filter(m => m.seasonId === s.id).length },
      }));
    }

    // Support include.matches (with optional where/select/take)
    if (args?.include?.matches !== undefined) {
      const allMatches = await readData<Match>('matches.json');
      data = data.map(s => {
        let sm = allMatches.filter(m => m.seasonId === s.id);
        const matchIncludeOpts = args.include.matches;
        if (matchIncludeOpts?.where) sm = applyWhere(sm, matchIncludeOpts.where);
        if (matchIncludeOpts?.orderBy) {
          const [f, d] = Object.entries(matchIncludeOpts.orderBy)[0] as [string, string];
          sm.sort((a: any, b: any) => {
            const va = new Date(a[f]).getTime();
            const vb = new Date(b[f]).getTime();
            return d === 'desc' ? vb - va : va - vb;
          });
        }
        if (matchIncludeOpts?.take) sm = sm.slice(0, matchIncludeOpts.take);
        if (matchIncludeOpts?.select) sm = sm.map((m: any) => applySelect(m, matchIncludeOpts.select)) as any;
        return { ...s, matches: sm };
      });
    }

    if (args?.select) {
      // For select that includes nested matches field
      if (args.select.matches !== undefined) {
        const allMatches = await readData<Match>('matches.json');
        const selected: any[] = data.map(s => {
          const withMatches: any = { ...s };
          let sm = allMatches.filter(m => m.seasonId === s.id);
          const matchSelectOpts = args.select.matches;
          if (matchSelectOpts?.where) sm = applyWhere(sm, matchSelectOpts.where);
          if (matchSelectOpts?.select) sm = sm.map((m: any) => applySelect(m, matchSelectOpts.select)) as any;
          withMatches.matches = sm;
          return applySelect(withMatches, args.select);
        });
        return selected as any;
      }
      return data.map(s => applySelect(s, args.select)) as any;
    }
    return data;
  },


  findUnique: async (args: { where: { id: string } }) => {
    const data = await readData<Season>('seasons.json');
    return data.find(s => s.id === args.where.id) || null;
  },

  findFirst: async (args?: any) => {
    const data = await readData<Season>('seasons.json');
    let filtered = args?.where ? applyWhere(data, args.where) : data;
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

  update: async (args: { where: { id: string }; data: any }) => {
    const data = await readData<Season>('seasons.json');
    const index = data.findIndex(s => s.id === args.where.id);
    if (index === -1) throw new Error('Season not found');
    data[index] = { ...data[index], ...args.data, updatedAt: new Date().toISOString() };
    await writeData('seasons.json', data);
    return data[index];
  },

  updateMany: async (args: { where?: any; data: any }) => {
    const data = await readData<Season>('seasons.json');
    let count = 0;
    const updated = data.map(item => {
      const matches = args.where ? applyWhere([item], args.where).length > 0 : true;
      if (matches) {
        count++;
        return { ...item, ...args.data, updatedAt: new Date().toISOString() };
      }
      return item;
    });
    await writeData('seasons.json', updated);
    return { count };
  },

  delete: async (args: { where: { id: string } }) => {
    let data = await readData<Season>('seasons.json');
    data = data.filter(s => s.id !== args.where.id);
    await writeData('seasons.json', data);
  },
};

// ─── Matches ──────────────────────────────────────────────────────────────────

const match = {
  findMany: async (args?: any): Promise<Match[]> => {
    let data = await readData<Match>('matches.json');
    if (args?.where) data = applyWhere(data, args.where);
    if (args?.orderBy) {
      const [field, dir] = Object.entries(args.orderBy)[0] as [string, string];
      data.sort((a: any, b: any) => {
        const va = new Date(a[field]).getTime();
        const vb = new Date(b[field]).getTime();
        return dir === 'desc' ? vb - va : va - vb;
      });
    }
    if (args?.include) {
      const players = await readData<Player>('players.json');
      const seasons = await readData<Season>('seasons.json');
      data = data.map(m => attachMatchRelations(m, args.include, players, seasons));
    }
    if (args?.select) {
      // For select, attach relations first if they're part of select
      const players = await readData<Player>('players.json');
      const seasons = await readData<Season>('seasons.json');
      const selected: any[] = data.map(m => {
        const fakeInclude: any = {};
        if (args.select.homePlayer) fakeInclude.homePlayer = args.select.homePlayer;
        if (args.select.awayPlayer) fakeInclude.awayPlayer = args.select.awayPlayer;
        if (args.select.season) fakeInclude.season = args.select.season;
        const withRels = attachMatchRelations(m, fakeInclude, players, seasons);
        return applySelect(withRels, args.select);
      });
      return selected as any;
    }
    if (args?.take) data = data.slice(0, args.take);
    return data as any;
  },

  findUnique: async (args: { where: { id: string }; include?: any }) => {
    const data = await readData<Match>('matches.json');
    const found = data.find(m => m.id === args.where.id) || null;
    if (found && args.include) {
      const players = await readData<Player>('players.json');
      const seasons = await readData<Season>('seasons.json');
      return attachMatchRelations(found, args.include, players, seasons);
    }
    return found;
  },

  create: async (args: { data: any; include?: any }) => {
    const data = await readData<Match>('matches.json');
    const newMatch: any = {
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
      return attachMatchRelations(newMatch, args.include, players, seasons);
    }
    return newMatch;
  },

  update: async (args: { where: { id: string }; data: any; include?: any }) => {
    const data = await readData<Match>('matches.json');
    const index = data.findIndex(m => m.id === args.where.id);
    if (index === -1) throw new Error('Match not found');
    data[index] = { ...data[index], ...args.data, updatedAt: new Date().toISOString() };
    await writeData('matches.json', data);
    if (args.include) {
      const players = await readData<Player>('players.json');
      const seasons = await readData<Season>('seasons.json');
      return attachMatchRelations(data[index], args.include, players, seasons);
    }
    return data[index];
  },

  delete: async (args: { where: { id: string } }) => {
    let data = await readData<Match>('matches.json');
    data = data.filter(m => m.id !== args.where.id);
    await writeData('matches.json', data);
  },

  deleteMany: async (args: { where?: any }) => {
    let data = await readData<Match>('matches.json');
    const initialLength = data.length;
    if (args.where) {
      // Keep items that do NOT match the where clause
      const toDelete = applyWhere(data, args.where);
      const toDeleteIds = new Set(toDelete.map((m: any) => m.id));
      data = data.filter((m: any) => !toDeleteIds.has(m.id));
    } else {
      data = [];
    }
    await writeData('matches.json', data);
    return { count: initialLength - data.length };
  },

  count: async (args?: any) => {
    let data = await readData<Match>('matches.json');
    if (args?.where) data = applyWhere(data, args.where);
    return data.length;
  },
};

// ─── Users ────────────────────────────────────────────────────────────────────

const user = {
  findUnique: async (args: { where: { username?: string; id?: string } }) => {
    const data = await readData<User>('users.json');
    return (
      data.find(u =>
        (args.where.username && u.username === args.where.username) ||
        (args.where.id && u.id === args.where.id)
      ) || null
    );
  },
};

// ─── Transaction helper ───────────────────────────────────────────────────────

const $transaction = async (queries: any[] | ((tx: any) => Promise<any>)) => {
  if (typeof queries === 'function') {
    return await (queries as any)(jsonDb);
  }
  return await Promise.all(queries);
};

// ─── Misc ─────────────────────────────────────────────────────────────────────

const $queryRaw = async (_query: any) => [{ 1: 1 }];
const $disconnect = async () => {};
const $connect = async () => {};

// ─── Export ───────────────────────────────────────────────────────────────────

export const jsonDb = {
  player,
  season,
  match,
  user,
  $transaction,
  $queryRaw,
  $disconnect,
  $connect,
};
