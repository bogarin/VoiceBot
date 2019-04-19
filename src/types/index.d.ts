import { GuildMember, Message, User } from "discord.js";

export type CommandTaskFn = (params: string, member: GuildMember, message?: Message, user?: User) => Promise<void>;

export interface ICommandTaskMapping {
  [s: string]: CommandTaskFn;
}

export type onEvent = (...args: any[]) => void;

export interface IEventMapping {
  [s: string]: onEvent;
}

export interface IEventClassMapping {
  [s: string]: IEventMapping;
}

export interface IVoiceCommandDetector {
  addOpusFrame: (id: string, opusFrames: Buffer) => void;
}

export interface IMemberMapping {
  [id: string]: GuildMember;
}
