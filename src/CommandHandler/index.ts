import { GuildMember, Message, User, VoiceConnection } from "discord.js";
import Detector from "native-voice-command-detector";
import CommandRunner from "../Commands";
import config from "../config";
import BotClient from "../Discord/BotClient";
import { MemberMapping } from "../types";
import logger from "../utils/logger";

export default class CommandHandler {
  private commandRunner: CommandRunner;
  private prefix = config.DISCORD_BOT_PREFIX;
  private prefixRegex = new RegExp("^" + this.prefix + "(.+)$");
  private commandDetector: Detector;
  private memberMapping: MemberMapping = {};

  public constructor(botClient: BotClient) {
    const eventMapping = {
      connection: { speaking: this.speakingEventHandler }
    };
    this.commandRunner = new CommandRunner(botClient, null, eventMapping);
    this.commandDetector = new Detector(
      config.PV_MODEL_PATH,
      config.PV_KEYWORD_PATH,
      parseFloat(config.PV_SENSITIVITY),
      config.GCLOUD_SPEECH_TO_TEXT_API_KEY,
      parseInt(config.MAX_VOICE_BUFFER_TTL, 10),
      parseInt(config.MAX_COMMAND_LENGTH, 10),
      parseInt(config.MAX_COMMAND_SILENCE_LENGTH, 10),
      this.voiceCommandHandler
    );
  }

  public messageEventHandler = async (message: Message): Promise<void> => {
    // Check for command message based on prefix
    const command = this.commandChecker(message.content);
    if (command === null) {
      return;
    }

    logger.info(
      `COMMAND_HANDLER: Command message ${command} from ${message.guild.name}:${
        message.member.nickname
      }.`
    );

    this.runCommand(command, message.member, message);
  };

  private runCommand = (
    command: string,
    member: GuildMember,
    message?: Message
  ): void => {
    // Command format: COMMAND PARAMETER1 PARAMETER2 ...
    const baseCommand: string = command.split(" ").length
      ? command.split(" ")[0]
      : command;
    const parameters = command.replace(`${baseCommand} `, "");

    // Pass to the command handler
    this.commandRunner.runCommand(baseCommand, parameters, member, message);
  };

  private commandChecker = (msgBody: string): string | null => {
    const possibleCommand = msgBody.match(this.prefixRegex)[1];
    return possibleCommand ? possibleCommand.trim() : null;
  };

  private voiceCommandHandler = (id: string, command: string): void => {
    const member: GuildMember = this.memberMapping[id];

    logger.info(
      `COMMAND_HANDLER: Voice command detected from member ${
        member.user.username
      }.`,
      command
    );

    this.runCommand(command, member);
  };

  private speakingEventHandler = async (
    user: User,
    connection: VoiceConnection,
    member: GuildMember
  ): Promise<void> => {
    logger.info(`COMMAND_HANDLER: Listening to ${user.username}.`);

    // Store the memeber data in the mapping for later reuse
    this.memberMapping[user.id] = member;

    // Create an Opus frame stream
    const audioStream = connection.receiver.createStream(user, {
      mode: "opus"
    });

    // Supply it to the native command detector
    audioStream.on(
      "data",
      (buf: Buffer): void => {
        this.commandDetector.addOpusFrame(user.id, buf);
      }
    );

    audioStream.on(
      "end",
      (): void => {
        logger.info(
          `COMMAND_HANDLER: No longer listening to ${user.username}.`
        );
      }
    );
  };
}
