import { GuildMember, Message, User, VoiceConnection } from "discord.js";
import fs from "fs";
import CommandRunner from "../Commands";
import config from "../config";
import BotClient from "../Discord/BotClient";
import logger from "../utils/logger";

export default class CommandHandler {
  public commandRunner: CommandRunner;
  public prefix = config.DISCORD_BOT_PREFIX;
  public prefixRegex = new RegExp("^" + this.prefix + "(.+)$");

  constructor(public botClient: BotClient) {
    const eventMapping = { connection: { speaking: this.speakingEventHandler } };
    this.commandRunner = new CommandRunner(botClient, null, eventMapping);
  }

  public commandChecker = (msgBody: string): string | null => {
    const possibleCommand = msgBody.match(this.prefixRegex)[1];

    return possibleCommand || null;
  };

  public messageEventHandler = async (message: Message) => {
    // Check for command message based on prefix
    const command = this.commandChecker(message.content);
    if (command === null) return;

    logger.info(`COMMAND_HANDLER: Command message ${command} from ${message.guild.name}:${message.member.nickname}.`);

    // Command format: COMMAND PARAMETER1 PARAMETER2 ...
    const baseCommand: string = command.split(" ") ? command.split(" ")[0] : command;
    const parameters = command.replace(`${baseCommand}`, "");

    // Pass to the command handler
    this.commandRunner.runCommand(baseCommand, parameters, message.member, message);
  };

  public speakingEventHandler = async (user: User, connection: VoiceConnection, member: GuildMember) => {
    logger.info(`COMMAND_HANDLER: Listening to ${user.username}.`);

    const audioStream = connection.receiver.createStream(user, { mode: "opus" });

    const outFileName = `./recording-${connection.channel.name}-${user.username}-${Date.now()}.opus`;
    const outputStream = fs.createWriteStream(outFileName);

    audioStream.pipe(outputStream);

    outputStream.on("data", console.log);

    audioStream.on("end", () => {
      logger.info(`COMMAND_HANDLER: No longer listening to ${user.username}.`);
    });
  };
}
