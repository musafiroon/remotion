import type {ComponentType, LazyExoticComponent} from 'react';
import {useContext, useMemo} from 'react';
import {CompositionManager} from './CompositionManager.js';
import {useResolvedVideoConfig} from './ResolveCompositionConfig.js';
import type {VideoConfig} from './video-config.js';

type ReturnType =
	| (VideoConfig & {
			component: LazyExoticComponent<ComponentType<unknown>>;
	  })
	| null;

export const useVideo = (): ReturnType => {
	const context = useContext(CompositionManager);

	const selected = context.compositions.find((c) => {
		return c.id === context.currentComposition;
	});
	const resolved = useResolvedVideoConfig(context.currentComposition);

	return useMemo((): ReturnType => {
		if (!resolved) {
			return null;
		}

		if (resolved.type === 'error') {
			// TODO: In the future, can be niver
			throw resolved.error;
		}

		if (resolved.type === 'loading') {
			return null;
		}

		if (!selected) {
			return null;
		}

		return {
			...resolved.result,
			defaultProps: selected.defaultProps,
			id: selected.id,
			// We override the selected metadata with the metadata that was passed to renderMedia(),
			// and don't allow it to be changed during render anymore
			...(context.currentCompositionMetadata ?? {}),
			component: selected.component,
		};
	}, [context.currentCompositionMetadata, resolved, selected]);
};
