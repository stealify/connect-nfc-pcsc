"use strict";

// #############
// Basic example
// - example reading and writing data on from/to card
// - should work well with any compatible PC/SC card reader
// - tested with Mifare Ultralight cards but should work with many others
// - example authentication for Mifare Classic cards
// #############

import winston from 'winston';
import NFC, { TAG_ISO_14443_3, TAG_ISO_14443_4, KEY_TYPE_A, KEY_TYPE_B } from '../src/NFC';
import pretty from './pretty';


// minilogger for debugging
//
// function log() {
// 	console.log(...arguments);
// }
//
// const minilogger = {
// 	log: log,
// 	debug: log,
// 	info: log,
// 	warn: log,
// 	error: log
// };

const nfc = new NFC(); // const nfc = new NFC(minilogger); // optionally you can pass logger to see internal debug logs

let readers = [];

nfc.on('reader', async reader => {

	pretty.info(`device attached`, { reader: reader.name });

	readers.push(reader);

	// needed for reading tags emulated with Android HCE AID
	// see https://developer.android.com/guide/topics/connectivity/nfc/hce.html
	reader.aid = 'F222222222';

	reader.on('card', async card => {


		// standard nfc tags like Mifare
		if (card.type === TAG_ISO_14443_3) {
			// const uid = card.uid;
			pretty.info(`card detected`, { reader: reader.name, card });
		}
		// Android HCE
		else if (card.type === TAG_ISO_14443_4) {
			// process raw Buffer data
			const data = card.data.toString('utf8');
			pretty.info(`card detected`, { reader: reader.name, card: { ...card, data } });
		}
		// not possible, just to be sure
		else {
			pretty.info(`card detected`, { reader: reader.name, card });
		}


		// Notice: reading data from Mifare Classic cards (e.g. Mifare 1K) requires,
		// that the data block must be authenticated first
		// don't forget to fill your keys and types
		// reader.authenticate(blockNumber, keyType, key, obsolete = false)
		// if you are experiencing problems, you can try using obsolete = true which is compatible with PC/SC V2.01
		// uncomment when you need it

		try {

			const key = 'FFFFFFFFFFFF';
			const keyType = KEY_TYPE_A;

			// we will authenticate block 4, 5, 6 (which we want to read and write)
			await Promise.all([
				reader.authenticate(4, keyType, key),
				reader.authenticate(5, keyType, key),
				reader.authenticate(6, keyType, key)
			]);

			pretty.info(`blocks successfully authenticated`);

		} catch (err) {
			pretty.error(`error when authenticating data`, { reader: reader.name, card, err });
			return;
		}


		// example reading 16 bytes assuming containing 16bit integer
		try {

			// reader.read(blockNumber, length, blockSize = 4, packetSize = 16)
			// - blockNumber - memory block number where to start reading
			// - length - how many bytes to read
			// ! Caution! length must be divisible by blockSize

			const data4 = await reader.read(4, 16, 16);
			pretty.info(`[4] data read`);
			pretty.info(`[4] data converted:`, data4.readInt16BE());

			const data5 = await reader.read(5, 16, 16);
			pretty.info(`[5] data read`);
			pretty.info(`[5] data converted:`, data5.readInt16BE());

			const data6 = await reader.read(6, 16, 16);
			pretty.info(`[6] data read`);
			pretty.info(`[6] data converted:`, data6.readInt16BE());

		} catch (err) {
			pretty.error(`error when reading data`, { reader: reader.name, card, err });
		}


		// example write 16bit integer
		try {

			// reader.write(blockNumber, data, blockSize = 4)
			// - blockNumber - memory block number where to start writing
			// - data - what to write
			// ! Caution! data.length must be divisible by blockSize

			const data4 = Buffer.allocUnsafe(16);
			data4.fill(0);
			data4.writeInt16BE(400);
			await reader.write(4, data4, 16);
			pretty.info(`[4] data written`, { reader: reader.name, card });

			const data5 = Buffer.allocUnsafe(16);
			data5.fill(0);
			data5.writeInt16BE(500);
			await reader.write(5, data5, 16);
			pretty.info(`[5] data written`, { reader: reader.name, card });

			const data6 = Buffer.allocUnsafe(16);
			data6.fill(0);
			data6.writeInt16BE(600);
			await reader.write(6, data6, 16);
			pretty.info(`[6] data written`, { reader: reader.name, card });

		} catch (err) {
			pretty.error(`error when writing data`, { reader: reader.name, card, err });
		}


	});

	reader.on('error', err => {

		pretty.error(`an error occurred`, { reader: reader.name, err });

	});

	reader.on('end', () => {

		pretty.info(`device removed`, { reader: reader.name });

		delete readers[readers.indexOf(reader)];

		console.log(readers);

	});


});

nfc.on('error', err => {

	pretty.error(`an error occurred`, err);

});
