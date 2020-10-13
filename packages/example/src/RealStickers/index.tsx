import {
	interpolate,
	registerVideo,
	spring2,
	SpringConfig,
	useCurrentFrame,
	useVideoConfig,
} from '@remotion/core';
import React from 'react';
import {output} from './data';
import './source';

const svgPath = require('svg-path-properties');

const spacePerSticker = 280;
const stickersInSmallestCircle = 7;
const stickerSize = 200;

export const RealStickers = () => {
	const videoConfig = useVideoConfig();
	const frame = useCurrentFrame();

	const springConfig: SpringConfig = {
		damping: 20,
		mass: 0.1,
		stiffness: 10,
		restSpeedThreshold: 0.00001,
		restDisplacementThreshold: 0.0001,
		overshootClamping: false,
	};

	const baseSpring = spring2({
		config: springConfig,
		from: 0,
		frame,
		fps: videoConfig.fps,
		to: 1,
	});
	const phoneScale = spring2({
		config: springConfig,

		from: 0,
		to: 1.2,
		fps: videoConfig.fps,
		frame,
	});
	const phoneSpring = spring2({
		config: {
			...springConfig,
			damping: 1000,
			mass: 1,
			stiffness: 2,
		},
		from: 0,
		to: 1,
		fps: videoConfig.fps,
		frame,
	});
	const scale = interpolate({
		input: baseSpring,
		inputRange: [0, 1],
		outputRange: [0, 0.7],
	});
	const spaceBetweenCircle = interpolate({
		input: baseSpring,
		inputRange: [0, 1],
		outputRange: [0.7, 1],
	});

	const scaleOut = spring2({
		config: springConfig,
		from: 0,
		to: 1,
		fps: videoConfig.fps,
		frame: videoConfig.durationInFrames - frame,
	});
	const phoneFrame = Math.floor(
		interpolate({
			input: phoneSpring,
			inputRange: [0, 1],
			outputRange: [1, 160],
		})
	);
	const _cData = (function () {
		let data: {
			cx: number;
			cy: number;
			rx: number;
			ry: number;
			stickersLength: number;
		}[] = [];
		const circumferenceNeededForSmallestCircle =
			spacePerSticker * stickersInSmallestCircle;
		let radius = circumferenceNeededForSmallestCircle / (Math.PI * 2);
		// eslint-disable-next-line fp/no-mutating-methods
		data.push({
			cx: videoConfig.width / 2,
			cy: videoConfig.height / 2,
			rx: radius,
			ry: radius,
			stickersLength: stickersInSmallestCircle,
		});
		for (let i = 0; i < 10; i++) {
			const nextRadius = radius + spacePerSticker;
			radius = nextRadius;
			const stickersFittingInNextRadius = Math.floor(
				((radius * Math.PI * 2) / circumferenceNeededForSmallestCircle) *
					stickersInSmallestCircle
			);
			data.push({
				cx: videoConfig.width / 2,
				cy: videoConfig.height / 2,
				ry: nextRadius * spaceBetweenCircle,
				rx: nextRadius * spaceBetweenCircle,
				stickersLength: stickersFittingInNextRadius,
			});
		}
		return data;
	})();

	const f = require('./imgs/Rotato Frame ' + phoneFrame + '.png').default;
	return (
		<div
			style={{
				width: videoConfig.width,
				height: videoConfig.height,
				backgroundColor: 'white',
			}}
		>
			<div
				style={{
					transform: `scale(${scale * scaleOut})`,
					width: videoConfig.width,
					height: videoConfig.height,
				}}
			>
				{output.map((o, i) => {
					const circle = (function () {
						let totalStickersFitted = 0;
						for (let j = 0; j < _cData.length; j++) {
							const c = _cData[j];
							totalStickersFitted += c.stickersLength;
							if (totalStickersFitted > i) {
								return {
									circle: j,
									indexOfCircle: i - totalStickersFitted + c.stickersLength,
								};
							}
						}
						throw new Error('wtf');
					})();
					const {cx, cy, rx, ry, stickersLength} = _cData[circle.circle];
					const d = `M${cx - rx},${cy}a${rx},${ry} 0 1,0 ${
						rx * 2
					},0a${rx},${ry} 0 1,0 -${rx * 2},0`;

					const p = svgPath.svgPathProperties(d);
					const length = p.getTotalLength();
					const direction = circle.circle % 2 ? -1 : 1;
					const currentPoint =
						(length / stickersLength) * circle.indexOfCircle +
						frame * 3 * direction;
					const point = p.getPointAtLength(
						(currentPoint + length * 1000) % length
					);
					return (
						<img
							src={`https://anysticker.imgix.net/${o.source}?w=${stickerSize}&h=${stickerSize}&fm=png&fill=solid&fit=fill&auto=compress`}
							style={{
								position: 'absolute',
								left: point.x - stickerSize / 2,
								top: point.y - stickerSize / 2,
								width: stickerSize,
								height: stickerSize,
							}}
						></img>
					);
				})}
				<img
					src={f}
					style={{position: 'absolute', transform: `scale(${phoneScale})`}}
				></img>
			</div>
		</div>
	);
};

registerVideo(RealStickers, {
	width: 1080,
	height: 1080,
	fps: 30,
	durationInFrames: 30 * 2.2,
});
