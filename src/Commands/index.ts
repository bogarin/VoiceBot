import { GuildMember, Message, User } from "discord.js";
import youtubeSearch from "youtube-search";
import ytdl from "ytdl-core";
import config from "../config";
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

    // Workaround for https://github.com/discordjs/discord.js/issues/2929
    await this.playURLCommand('https://www.youtube.com/watch?v=W8svHrWMC1c', member);
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

  public playCommand = async (params: string, member: GuildMember) => {
    if (!member.voice.channel) return;

    const connection = await member.voice.channel.join();

    // Search for a clip to play
    const searchOptions: youtubeSearch.YouTubeSearchOptions = {
      maxResults: 1,
      key: config.YOUTUBE_API_KEY
    };

    const searchResponse: youtubeSearch.YouTubeSearchResults[] = await new Promise((resolve, reject) => {
      youtubeSearch(params, searchOptions, (err, res) => {
        if (err) {
          reject(err);
          logger.error(
            `COMMAND_RUNNER: Failed to find an applicable clip for ${params} as per the request of ${
              member.user.username
            } from ${member.voice.channel.name}.`
          );
          return;
        }
        resolve(res);
      });
    });

    const url = searchResponse[0] ? searchResponse[0].link : null;

    if (!url) {
      logger.error(`COMMAND_RUNNER: No valid Youtube URL found to play.`);
      return;
    }

    // Play the clip
    logger.info(`Starting to play ${url} on ${member.voice.channel.name}.`);
    const dispatcher = connection.play(
      ytdl(url, {
        quality: "highestaudio"
      })
    );
    dispatcher.on("error", () => {
      logger.error(`COMMAND_RUNNER: Error while playing ${url} on ${member.voice.channel.name}.`);
    });
    dispatcher.on("finish", () => {
      logger.info(`COMMAND_RUNNER: Finished playing ${url} on ${member.voice.channel.name}.`);
    });
    logger.info(`COMMAND_RUNNER: Playing ${url} on VC:${member.voice.channel.name} as per command.`);
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
      play: this.playCommand,
      ping: this.pingCommand
    };

    const task = commandMapping[command];
    if (!task) return;

    return task(parameters, member, message, user);
  };
}
