import {CliInternals} from '@remotion/cli';
import {ConfigInternals} from '@remotion/cli/config';

import {Internals} from 'remotion';
import {deploySite} from '../../../api/deploy-site';
import {internalGetOrCreateBucket} from '../../../api/get-or-create-bucket';
import type {Privacy} from '../../../shared/constants';
import {BINARY_NAME} from '../../../shared/constants';
import {validateSiteName} from '../../../shared/validate-site-name';
import {parsedLambdaCli} from '../../args';
import {getAwsRegion} from '../../get-aws-region';
import type {
	BucketCreationProgress,
	BundleProgress,
	DeployToS3Progress,
} from '../../helpers/progress-bar';
import {
	makeBucketProgress,
	makeBundleProgress,
	makeDeployProgressBar,
} from '../../helpers/progress-bar';
import {quit} from '../../helpers/quit';
import {Log} from '../../log';

export const SITES_CREATE_SUBCOMMAND = 'create';

export const sitesCreateSubcommand = async (
	args: string[],
	remotionRoot: string,
) => {
	const {file, reason} = CliInternals.findEntryPoint(args, remotionRoot);
	if (!file) {
		Log.error('No entry file passed.');
		Log.info(
			'Pass an additional argument specifying the entry file of your Remotion project:',
		);
		Log.info();
		Log.info(`${BINARY_NAME} deploy <entry-file.ts>`);
		quit(1);
		return;
	}

	Log.verbose('Entry point:', file, 'Reason:', reason);

	const desiredSiteName = parsedLambdaCli['site-name'] ?? undefined;
	if (desiredSiteName !== undefined) {
		validateSiteName(desiredSiteName);
	}

	const progressBar = CliInternals.createOverwriteableCliOutput({
		quiet: CliInternals.quietFlagProvided(),
		cancelSignal: null,
		// No browser logs
		updatesDontOverwrite: false,
		indent: false,
	});

	const multiProgress: {
		bundleProgress: BundleProgress;
		bucketProgress: BucketCreationProgress;
		deployProgress: DeployToS3Progress;
	} = {
		bundleProgress: {
			doneIn: null,
			progress: 0,
		},
		bucketProgress: {
			doneIn: null,
		},
		deployProgress: {
			doneIn: null,
			totalSize: null,
			sizeUploaded: 0,
			stats: null,
		},
	};

	const updateProgress = () => {
		progressBar.update(
			[
				makeBundleProgress(multiProgress.bundleProgress),
				makeBucketProgress(multiProgress.bucketProgress),
				makeDeployProgressBar(multiProgress.deployProgress),
			].join('\n'),
			false,
		);
	};

	const bucketStart = Date.now();

	const enableFolderExpiry = parsedLambdaCli['enable-folder-expiry'];
	const cliBucketName = parsedLambdaCli['force-bucket-name'] ?? null;
	const bucketName =
		cliBucketName ??
		(
			await internalGetOrCreateBucket({
				region: getAwsRegion(),
				enableFolderExpiry: enableFolderExpiry ?? null,
				customCredentials: null,
			})
		).bucketName;

	multiProgress.bucketProgress.doneIn = Date.now() - bucketStart;
	updateProgress();

	const bundleStart = Date.now();
	let uploadStart = Date.now();

	const {serveUrl, siteName, stats} = await deploySite({
		entryPoint: file,
		siteName: desiredSiteName,
		bucketName,
		options: {
			onBundleProgress: (progress: number) => {
				multiProgress.bundleProgress = {
					progress,
					doneIn: progress === 100 ? Date.now() - bundleStart : null,
				};
				if (progress === 100) {
					uploadStart = Date.now();
				}
			},
			onUploadProgress: (p) => {
				multiProgress.deployProgress = {
					sizeUploaded: p.sizeUploaded,
					totalSize: p.totalSize,
					doneIn: null,
					stats: null,
				};
				updateProgress();
			},
			enableCaching: ConfigInternals.getWebpackCaching(),
			webpackOverride: ConfigInternals.getWebpackOverrideFn() ?? ((f) => f),
			bypassBucketNameValidation: Boolean(parsedLambdaCli['force-bucket-name']),
		},
		region: getAwsRegion(),
		privacy: parsedLambdaCli.privacy as Exclude<Privacy, 'private'> | undefined,
	});
	const uploadDuration = Date.now() - uploadStart;
	multiProgress.deployProgress = {
		sizeUploaded: 1,
		totalSize: 1,
		doneIn: uploadDuration,
		stats: {
			addedFiles: stats.uploadedFiles,
			removedFiles: stats.deletedFiles,
			untouchedFiles: stats.untouchedFiles,
		},
	};
	updateProgress();

	Log.info();
	Log.info();
	Log.info('Deployed to S3!');

	Log.info(`Serve URL: ${serveUrl}`);
	Log.info(`Site Name: ${siteName}`);

	Log.info();
	Log.info(
		CliInternals.chalk.blueBright(
			'ℹ️ If you make changes to your code, you need to redeploy the site. You can overwrite the existing site by running:',
		),
	);
	Log.info(
		CliInternals.chalk.blueBright(
			['npx remotion lambda sites create', args[0], `--site-name=${siteName}`]
				.filter(Internals.truthy)
				.join(' '),
		),
	);
};
