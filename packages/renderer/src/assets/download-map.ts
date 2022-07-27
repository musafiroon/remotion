import type {TAsset} from 'remotion';
import {tmpDir} from '../tmp-dir';

type EncodingStatus =
	| {
			type: 'encoding';
	  }
	| {
			type: 'done';
			src: string;
	  }
	| undefined;

export type SpecialVCodecForTransparency = 'vp9' | 'vp8' | 'none';

export type Vp9Result = {
	specialVcodec: SpecialVCodecForTransparency;
	needsResize: [number, number] | null;
};
export type VideoDurationResult = {
	duration: number | null;
	fps: number | null;
};

export type AudioChannelsAndDurationResultCache = {
	channels: number;
	duration: number | null;
};

export type DownloadMap = {
	id: string;
	isDownloadingMap: {
		[src: string]:
			| {
					[downloadDir: string]: boolean;
			  }
			| undefined;
	};
	hasBeenDownloadedMap: {
		[src: string]:
			| {
					[downloadDir: string]: string | null;
			  }
			| undefined;
	};
	listeners: {[key: string]: {[downloadDir: string]: (() => void)[]}};
	lastFrameMap: Record<string, {lastAccessed: number; data: Buffer}>;
	isBeyondLastFrameMap: Record<string, number>;
	isVp9VideoCache: Record<string, Vp9Result>;
	ensureFileHasPresentationTimestamp: Record<string, EncodingStatus>;
	videoDurationResultCache: Record<string, VideoDurationResult>;
	durationOfAssetCache: Record<string, AudioChannelsAndDurationResultCache>;
	downloadDir: string;
};

export type RenderAssetInfo = {
	assets: TAsset[][];
	imageSequenceName: string;
	firstFrameIndex: number;
	downloadMap: DownloadMap;
};

export const makeDownloadMap = (): DownloadMap => {
	return {
		isDownloadingMap: {},
		hasBeenDownloadedMap: {},
		listeners: {},
		lastFrameMap: {},
		isBeyondLastFrameMap: {},
		ensureFileHasPresentationTimestamp: {},
		isVp9VideoCache: {},
		videoDurationResultCache: {},
		durationOfAssetCache: {},
		id: String(Math.random()),
		downloadDir: tmpDir('remotion-assets-dir'),
	};
};
