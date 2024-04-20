import amqplib from 'amqplib';

const queue = 'votes';

const conn = await amqplib.connect(process.env.QUEUE_URI!);
const voteChannel = await conn.createChannel();

export function send(msg: string) {
    voteChannel.sendToQueue(queue, Buffer.from(msg));
}
