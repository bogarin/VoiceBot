import { GuildMember, Message, User } from "discord.js";
import ytdl from "ytdl-core";
import BotClient from "../Discord/BotClient";
import { ICommandTaskMapping, IEventClassMapping } from "../types";
import logger from "../utils/logger";

export default class CommandRunner {
  constructor(
    public botClient: BotClient,
    public userClient: BotClient | null,
    public eventMapping: IEventClassMapping | null
  ) {}
  public joinCommand = async (params: string, member: GuildMember) => {
    if (!member.voice.channel) return;

    const connection = await member.voice.channel.join();

    connection.on("speaking", (user: User, speaking: boolean) => {
      if (!speaking) return;

      if (this.eventMapping.connection && this.eventMapping.connection.speaking) {
        this.eventMapping.connection.speaking(user, connection, member);
      }
    });
    logger.info(`COMMAND_RUNNER: Joined VC:${member.voice.channel.name} as per command.`);
  };

  public leaveCommand = async (params: string, member: GuildMember) => {
    if (!member.voice.channel) return;

    await member.voice.channel.leave();
    logger.info(`COMMAND_RUNNER: Left VC:${member.voice.channel.name} as per command.`);
  };

  public playURLCommand = async (params: string, member: GuildMember) => {
    if (!member.voice.channel) return;

    const connection = await member.voice.channel.join();

    // Play the clip
    logger.info(`Starting to play ${params} on ${member.voice.channel.name}.`);
    const dispatcher = connection.play(
      ytdl(params, {
        quality: "highestaudio"
      })
    );
    dispatcher.on("error", () => {
      logger.error(`COMMAND_RUNNER: Error while playing ${params} on ${member.voice.channel.name}.`);
    });
    dispatcher.on("finish", () => {
      logger.info(`COMMAND_RUNNER: Finished playing ${params} on ${member.voice.channel.name}.`);
    });
    logger.info(`COMMAND_RUNNER: Playing ${params} on VC:${member.voice.channel.name} as per command.`);
  };

  public pingCommand = async (params: string, member: GuildMember, message: Message) => {
    const botMessage = (await message.channel.send("Ping?")) as Message;
    await botMessage.edit(`Pong! Latency is ${botMessage.createdTimestamp - message.createdTimestamp}ms.`);
    logger.info(`COMMAND_RUNNER: Replied to PING on ${message.channel} as per command.`);
  };

  public runCommand = (command: string, parameters: string, member: GuildMember, message?: Message, user?: User) => {
    logger.info(`COMMAND_RUNNER: Command: ${command}, parameters:${parameters}`);

    // Find and execute the correct command
    const commandMapping: ICommandTaskMapping = {
      join: this.joinCommand,
      leave: this.leaveCommand,
      playurl: this.playURLCommand,
      ping: this.pingCommand
    };

    const task = commandMapping[command];
    if (!task) return;

    return task(parameters, member, message, user);
  };
}
