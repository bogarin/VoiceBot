import { GuildMember, Message, User, VoiceConnection } from "discord.js";
import CommandRunner from "../Commands";
import config from "../config";
import BotClient from "../Discord/BotClient";
import { IMemberMapping, IVoiceCommandDetector } from "../types";
import logger from "../utils/logger";

// @ts-ignore
const { Detector } = require("bindings")("detector");

export default class CommandHandler {
  public commandRunner: CommandRunner;
  public prefix = config.DISCORD_BOT_PREFIX;
  public prefixRegex = new RegExp("^" + this.prefix + "(.+)$");
  public commandDetector: IVoiceCommandDetector;
  public memberMapping: IMemberMapping = {};

  constructor(public botClient: BotClient) {
    const eventMapping = { connection: { speaking: this.speakingEventHandler } };
    this.commandRunner = new CommandRunner(botClient, null, eventMapping);
    this.commandDetector = new Detector(this.voiceCommandHandler);
  }

  public runCommand = (command: string, member: GuildMember, message?: Message) => {
    // Command format: COMMAND PARAMETER1 PARAMETER2 ...
    const baseCommand: string = command.split(" ").length ? command.split(" ")[0] : command;
    const parameters = command.replace(`${baseCommand} `, "");

    // Pass to the command handler
    this.commandRunner.runCommand(baseCommand, parameters, member, message);
  };

  public commandChecker = (msgBody: string): string | null => {
    const possibleCommand = msgBody.match(this.prefixRegex)[1];
    return possibleCommand ? possibleCommand.trim() : null;
  };

  public voiceCommandHandler = (id: string, jsonData: string) => {
    const member: GuildMember = this.memberMapping[id];
    const commandData = JSON.parse(jsonData);

    const command = commandData.results[0].alternatives[0].transcript;

    logger.info(`COMMAND_HANDLER: Voice command detected from member ${member.user.username}.`, command);

    this.runCommand(command, member);
  };

  public messageEventHandler = async (message: Message) => {
    // Check for command message based on prefix
    const command = this.commandChecker(message.content);
    if (command === null) return;

    logger.info(`COMMAND_HANDLER: Command message ${command} from ${message.guild.name}:${message.member.nickname}.`);

    this.runCommand(command, message.member, message);
  };

  public speakingEventHandler = async (user: User, connection: VoiceConnection, member: GuildMember) => {
    logger.info(`COMMAND_HANDLER: Listening to ${user.username}.`);

    // Store the memeber data in the mapping for later reuse
    this.memberMapping[user.id] = member;

    // Create an Opus frame stream
    const audioStream = connection.receiver.createStream(user, { mode: "opus" });

    // Supply it to the native command detector
    audioStream.on("data", (buf: Buffer) => {
      this.commandDetector.addOpusFrame(user.id, buf);
    });

    audioStream.on("end", () => {
      logger.info(`COMMAND_HANDLER: No longer listening to ${user.username}.`);
    });
  };
}
