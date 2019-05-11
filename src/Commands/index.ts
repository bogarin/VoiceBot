import { GuildMember, Message, User } from "discord.js";
import youtubeSearch from "youtube-search";
import ytdl from "ytdl-core";
import config from "../config";
import BotClient from "../Discord/BotClient";
import { CommandTaskMapping, EventClassMapping } from "../types";
import logger from "../utils/logger";

export default class CommandRunner {
  private botClient: BotClient;
  private userClient: BotClient;
  private eventMapping: EventClassMapping;

  public constructor(
    botClient: BotClient,
    userClient: BotClient,
    eventMapping: EventClassMapping
  ) {
    this.botClient = botClient;
    this.userClient = userClient;
    this.eventMapping = eventMapping;
  }
  public runCommand = async (
    command: string,
    parameters: string,
    member: GuildMember,
    message?: Message,
    user?: User
  ): Promise<void> => {
    logger.info(
      `COMMAND_RUNNER: Command: ${command}, parameters:${parameters}`
    );

    // Find and execute the correct command
    const commandMapping: CommandTaskMapping = {
      join: this.joinCommand,
      leave: this.leaveCommand,
      playurl: this.playURLCommand,
      play: this.playCommand,
      ping: this.pingCommand
    };

    const task = commandMapping[command];
    if (!task) {
      return;
    }

    return task(parameters, member, message, user);
  };

  private joinCommand = async (
    params: string,
    member: GuildMember
  ): Promise<void> => {
    if (!member.voice.channel) {
      return;
    }

    const connection = await member.voice.channel.join();

    connection.on(
      "speaking",
      (user: User, speaking: boolean): void => {
        if (!speaking) {
          return;
        }

        if (
          this.eventMapping.connection &&
          this.eventMapping.connection.speaking
        ) {
          this.eventMapping.connection.speaking(user, connection, member);
        }
      }
    );
    logger.info(
      `COMMAND_RUNNER: Joined VC:${member.voice.channel.name} as per command.`
    );

    // Workaround for https://github.com/discordjs/discord.js/issues/2929
    await this.playURLCommand(
      "https://www.youtube.com/watch?v=W8svHrWMC1c",
      member
    );
  };

  private leaveCommand = async (
    params: string,
    member: GuildMember
  ): Promise<void> => {
    if (!member.voice.channel) {
      return;
    }

    await member.voice.channel.leave();
    logger.info(
      `COMMAND_RUNNER: Left VC:${member.voice.channel.name} as per command.`
    );
  };

  private playURLCommand = async (
    params: string,
    member: GuildMember
  ): Promise<void> => {
    if (!member.voice.channel) {
      return;
    }

    const connection = await member.voice.channel.join();

    // Play the clip
    logger.info(`Starting to play ${params} on ${member.voice.channel.name}.`);
    const dispatcher = connection.play(
      ytdl(params, { quality: "highestaudio" })
    );
    dispatcher.on(
      "error",
      (): void => {
        logger.error(
          `COMMAND_RUNNER: Error while playing ${params} on ${
            member.voice.channel.name
          }.`
        );
      }
    );
    dispatcher.on(
      "finish",
      (): void => {
        logger.info(
          `COMMAND_RUNNER: Finished playing ${params} on ${
            member.voice.channel.name
          }.`
        );
      }
    );
    logger.info(
      `COMMAND_RUNNER: Playing ${params} on VC:${
        member.voice.channel.name
      } as per command.`
    );
  };

  private playCommand = async (
    params: string,
    member: GuildMember
  ): Promise<void> => {
    if (!member.voice.channel) {
      return;
    }

    const connection = await member.voice.channel.join();

    // Search for a clip to play
    const searchOptions: youtubeSearch.YouTubeSearchOptions = {
      maxResults: 1,
      key: config.YOUTUBE_API_KEY
    };

    const searchResponse: youtubeSearch.YouTubeSearchResults[] = await new Promise(
      (resolve, reject): void => {
        youtubeSearch(
          params,
          searchOptions,
          (err, res): void => {
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
          }
        );
      }
    );

    const url = searchResponse[0] ? searchResponse[0].link : null;

    if (!url) {
      logger.error(`COMMAND_RUNNER: No valid Youtube URL found to play.`);
      return;
    }

    // Play the clip
    logger.info(`Starting to play ${url} on ${member.voice.channel.name}.`);
    const dispatcher = connection.play(ytdl(url, { quality: "highestaudio" }));
    dispatcher.on(
      "error",
      (): void => {
        logger.error(
          `COMMAND_RUNNER: Error while playing ${url} on ${
            member.voice.channel.name
          }.`
        );
      }
    );
    dispatcher.on(
      "finish",
      (): void => {
        logger.info(
          `COMMAND_RUNNER: Finished playing ${url} on ${
            member.voice.channel.name
          }.`
        );
      }
    );
    logger.info(
      `COMMAND_RUNNER: Playing ${url} on VC:${
        member.voice.channel.name
      } as per command.`
    );
  };

  private pingCommand = async (
    params: string,
    member: GuildMember,
    message: Message
  ): Promise<void> => {
    const botMessage = (await message.channel.send("Ping?")) as Message;
    await botMessage.edit(
      `Pong! Latency is ${botMessage.createdTimestamp -
        message.createdTimestamp}ms.`
    );
    logger.info(
      `COMMAND_RUNNER: Replied to PING on ${message.channel} as per command.`
    );
  };
}
