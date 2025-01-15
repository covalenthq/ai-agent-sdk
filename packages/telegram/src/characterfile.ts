type UUID = `${string}-${string}-${string}-${string}-${string}`;

type Media = {
	/** Unique identifier */
	id: string;
	/** Media URL */
	url: string;
	/** Media title */
	title: string;
	/** Media source */
	source: string;
	/** Media description */
	description: string;
	/** Text content */
	text: string;
	/** Content type */
	contentType?: string;
};

interface Content {
	/** The main text content */
	text: string;
	/** Optional action associated with the message */
	action?: string;
	/** Optional source/origin of the content */
	source?: string;
	/** URL of the original message/post (e.g. tweet URL, Discord message link) */
	url?: string;
	/** UUID of parent message if this is a reply/thread */
	inReplyTo?: UUID;
	/** Array of media attachments */
	attachments?: Media[];
	/** Additional dynamic properties */
	[key: string]: unknown;
}

interface Memory {
	/** Optional unique identifier */
	id?: UUID;
	/** Associated user ID */
	userId: UUID;
	/** Associated agent ID */
	agentId: UUID;
	/** Optional creation timestamp */
	createdAt?: number;
	/** Memory content */
	content: Content;
	/** Optional embedding vector */
	embedding?: number[];
	/** Associated room ID */
	roomId: UUID;
	/** Whether memory is unique */
	unique?: boolean;
	/** Embedding similarity score */
	similarity?: number;
}

interface MessageExample {
	/** Associated user */
	user: string;
	/** Message content */
	content: Content;
}

type TelemetrySettings = {
	/**
	 * Enable or disable telemetry. Disabled by default while experimental.
	 */
	isEnabled?: boolean;
	/**
	 * Enable or disable input recording. Enabled by default.
	 *
	 * You might want to disable input recording to avoid recording sensitive
	 * information, to reduce data transfers, or to increase performance.
	 */
	recordInputs?: boolean;
	/**
	 * Enable or disable output recording. Enabled by default.
	 *
	 * You might want to disable output recording to avoid recording sensitive
	 * information, to reduce data transfers, or to increase performance.
	 */
	recordOutputs?: boolean;
	/**
	 * Identifier for this function. Used to group telemetry data by function.
	 */
	functionId?: string;
};

interface ModelConfiguration {
	temperature?: number;
	max_response_length?: number;
	frequency_penalty?: number;
	presence_penalty?: number;
	maxInputTokens?: number;
	experimental_telemetry?: TelemetrySettings;
}

type ModelProviderName = string;

type Clients = string;

declare enum TranscriptionProvider {
	OpenAI = "openai",
	Deepgram = "deepgram",
}

type Character = {
	/** Optional unique identifier */
	id?: UUID;
	/** Character name */
	name: string;
	/** Optional username */
	username?: string;
	/** Optional system prompt */
	system?: string;
	/** Model provider to use */
	modelProvider: ModelProviderName;
	/** Image model provider to use, if different from modelProvider */
	imageModelProvider?: ModelProviderName;
	/** Image Vision model provider to use, if different from modelProvider */
	imageVisionModelProvider?: ModelProviderName;
	/** Optional model endpoint override */
	modelEndpointOverride?: string;
	/** Optional prompt templates */
	templates?: {
		goalsTemplate?: string;
		factsTemplate?: string;
		messageHandlerTemplate?: string;
		shouldRespondTemplate?: string;
		continueMessageHandlerTemplate?: string;
		evaluationTemplate?: string;
		twitterSearchTemplate?: string;
		twitterActionTemplate?: string;
		twitterPostTemplate?: string;
		twitterMessageHandlerTemplate?: string;
		twitterShouldRespondTemplate?: string;
		farcasterPostTemplate?: string;
		lensPostTemplate?: string;
		farcasterMessageHandlerTemplate?: string;
		lensMessageHandlerTemplate?: string;
		farcasterShouldRespondTemplate?: string;
		lensShouldRespondTemplate?: string;
		telegramMessageHandlerTemplate?: string;
		telegramShouldRespondTemplate?: string;
		discordVoiceHandlerTemplate?: string;
		discordShouldRespondTemplate?: string;
		discordMessageHandlerTemplate?: string;
		slackMessageHandlerTemplate?: string;
		slackShouldRespondTemplate?: string;
	};
	/** Character biography */
	bio: string | string[];
	/** Character background lore */
	lore: string[];
	/** Example messages */
	messageExamples: MessageExample[][];
	/** Example posts */
	postExamples: string[];
	/** Known topics */
	topics: string[];
	/** Character traits */
	adjectives: string[];
	/** Optional knowledge base */
	knowledge?: string[];
	/** Supported client platforms */
	clients: Clients[];
	/** Available plugins */
	plugins: Plugin[];
	/** Optional configuration */
	settings?: {
		secrets?: {
			[key: string]: string;
		};
		intiface?: boolean;
		imageSettings?: {
			steps?: number;
			width?: number;
			height?: number;
			negativePrompt?: string;
			numIterations?: number;
			guidanceScale?: number;
			seed?: number;
			modelId?: string;
			jobId?: string;
			count?: number;
			stylePreset?: string;
			hideWatermark?: boolean;
		};
		voice?: {
			model?: string;
			url?: string;
			elevenlabs?: {
				voiceId: string;
				model?: string;
				stability?: string;
				similarityBoost?: string;
				style?: string;
				useSpeakerBoost?: string;
			};
		};
		model?: string;
		modelConfig?: ModelConfiguration;
		embeddingModel?: string;
		chains?: {
			[key: string]: unknown[];
		};
		transcription?: TranscriptionProvider;
	};
	/** Optional client-specific config */
	clientConfig?: {
		discord?: {
			shouldIgnoreBotMessages?: boolean;
			shouldIgnoreDirectMessages?: boolean;
			shouldRespondOnlyToMentions?: boolean;
			messageSimilarityThreshold?: number;
			isPartOfTeam?: boolean;
			teamAgentIds?: string[];
			teamLeaderId?: string;
			teamMemberInterestKeywords?: string[];
		};
		telegram?: {
			shouldIgnoreBotMessages?: boolean;
			shouldIgnoreDirectMessages?: boolean;
			shouldRespondOnlyToMentions?: boolean;
			shouldOnlyJoinInAllowedGroups?: boolean;
			allowedGroupIds?: string[];
			messageSimilarityThreshold?: number;
			isPartOfTeam?: boolean;
			teamAgentIds?: string[];
			teamLeaderId?: string;
			teamMemberInterestKeywords?: string[];
		};
		slack?: {
			shouldIgnoreBotMessages?: boolean;
			shouldIgnoreDirectMessages?: boolean;
		};
		gitbook?: {
			keywords?: {
				projectTerms?: string[];
				generalQueries?: string[];
			};
			documentTriggers?: string[];
		};
	};
	/** Writing style guides */
	style: {
		all: string[];
		chat: string[];
		post: string[];
	};
	/** Optional Twitter profile */
	twitterProfile?: {
		id: string;
		username: string;
		screenName: string;
		bio: string;
		nicknames?: string[];
	};
	/** Optional NFT prompt */
	nft?: {
		prompt: string;
	};
};
