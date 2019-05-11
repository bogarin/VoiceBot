import { GuildMember, Message, User } from "discord.js";

export type CommandTaskFn = (
  params: string,
  member: GuildMember,
  message?: Message,
  user?: User
) => Promise<void>;

export interface CommandTaskMapping {
  [s: string]: CommandTaskFn;
}

/* eslint-disable-next-line */
export type onEvent = (...args: any[]) => void;

export interface EventMapping {
  [s: string]: onEvent;
}

export interface EventClassMapping {
  [s: string]: EventMapping;
}

export interface MemberMapping {
  [id: string]: GuildMember;
}
