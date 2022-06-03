import process from 'node:process';
import {Editframe} from '@editframe/editframe-js';

const buildVideo = async ({
	audio,
	images: {introImage, part1Images, part2Images, logoImage},
	text: {locationText, hostText, catchphraseText, catchphraseText2},
}) => {
	const editframe = new Editframe({
		clientId: process.env.EDITFRAME_CLIENT_ID,
		token: process.env.EDITFRAME_API_TOKEN,
	});

	const composition = await editframe.videos.new({
		dimensions: {
			height: 1080,
			width: 1920,
		},
	});

	const makeImage = async ({
		duration,
		fadeIn = false,
		fadeOut = false,
		resizeImage = true,
		url,
	}) => {
		const image = await composition.addImage(url, {
			position: {
				x: 'center',
				y: 'center',
			},
			trim: {
				end: duration,
			},
		});

		if (resizeImage) {
			image.setHeight(composition.dimensions.height - 150);
		}

		if (fadeIn) {
			image.addTransition({duration: 1, type: 'fadeIn'});
		}

		if (fadeOut) {
			image.addTransition({duration: 1, type: 'fadeOut'});
		}

		return image;
	};

	const makeText = ({
		duration = 3,
		isRelative = false,
		text,
		fontSize = 70,
		y = 'center',
	}) =>
		composition.addText(
			{
				color: '#ffffff',
				fontFamily: 'Montserrat',
				fontSize,
				fontWeight: 500,
				text,
				textAlign: 'center',
			},
			{
				position: {
					isRelative,
					x: 'center',
					y,
				},
				size: {
					height: 0,
				},
				trim: {
					end: duration,
				},
			},
		);

	const introImageLayer = await makeImage({
		duration: 3,
		fadeIn: true,
		url: introImage,
	});

	const part1ImageLayers = [];
	let part2ImageLayers = [];

	for (const url of part1Images) {
		part1ImageLayers.push(await makeImage({duration: 3, url}));
	}

	for (const url of part2Images) {
		const image = await makeImage({
			duration: 3,
			fadeIn: true,
			fadeOut: true,
			url,
		});
		const spacer = await makeImage({duration: 0.75, url: spacerImage});

		part2ImageLayers = [...part2ImageLayers, image, spacer];
	}

	const locationTextLayer = makeText({
		isRelative: true,
		text: locationText,
		y: 0.45,
	});

	const hostedByTextLayer = makeText({
		duration: 2,
		fontSize: 50,
		isRelative: true,
		text: `Hosted by ${hostText}`,
		y: 0.55,
	});

	const catchphraseTextLayer = makeText({
		duration: 2,
		text: catchphraseText,
	});

	const catchphraseTextLayer2 = makeText({
		duration: 2,
		text: catchphraseText2,
	});

	const logoLayer = await makeImage({
		duration: 3,
		resizeImage: false,
		url: logoImage,
	});

	const spacerEndLayer = await makeImage({
		duration: 10,
		url: spacerImage,
	});

	await composition.addSequence([
		introImageLayer,
		...part1ImageLayers,
		locationTextLayer,
		...part2ImageLayers,
		catchphraseTextLayer,
		catchphraseTextLayer2,
		logoLayer,
		spacerEndLayer,
	]);

	// The call to `addSequence()` updates the `start`
	// attributes of each provided layer, so we can
	// refer to the sequenced `locationTextLayer`'s `start`
	// time to determine when to set the `start` time of the `hostedByTextLayer`
	hostedByTextLayer.setStart(locationTextLayer.start + 1);

	await composition.addAudio(
		audio,
		{volume: 1},
		{
			transitions: [
				{
					duration: 10,
					type: 'fadeOut',
				},
			],
			trim: {
				end: composition.duration,
			},
		},
	);

	const result = await composition.encode();

	console.log(JSON.stringify(result));
};

const audio =
	'https://efapisplat.nyc3.digitaloceanspaces.com/guides/airbnb-made-possible-by-hosts/arlae.mp3';
const introImage =
	'https://efapisplat.nyc3.digitaloceanspaces.com/guides/airbnb-made-possible-by-hosts/together.jpg';
const part1Images = [
	'https://efapisplat.nyc3.digitaloceanspaces.com/guides/airbnb-made-possible-by-hosts/ocean-drive.jpg',
	'https://efapisplat.nyc3.digitaloceanspaces.com/guides/airbnb-made-possible-by-hosts/juice.jpg',
];
const part2Images = [
	'https://efapisplat.nyc3.digitaloceanspaces.com/guides/airbnb-made-possible-by-hosts/crab.jpg',
	'https://efapisplat.nyc3.digitaloceanspaces.com/guides/airbnb-made-possible-by-hosts/street-art.jpg',
	'https://efapisplat.nyc3.digitaloceanspaces.com/guides/airbnb-made-possible-by-hosts/tree.jpg',
	'https://efapisplat.nyc3.digitaloceanspaces.com/guides/airbnb-made-possible-by-hosts/sushi.jpg',
];
const spacerImage =
	'https://efapisplat.nyc3.digitaloceanspaces.com/guides/airbnb-made-possible-by-hosts/spacer.jpg';
const logoImage =
	'https://efapisplat.nyc3.digitaloceanspaces.com/guides/airbnb-made-possible-by-hosts/editframe-logo.png';
const locationText = 'Miami Beach';
const hostText = 'Jean Carlos';
const catchphraseText = 'Something to write home about';
const catchphraseText2 = 'Made possible by Editframe';

buildVideo({
	audio,
	images: {introImage, part1Images, part2Images, logoImage},
	text: {locationText, hostText, catchphraseText, catchphraseText2},
});
