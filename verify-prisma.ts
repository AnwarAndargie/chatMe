import 'dotenv/config'
import prisma from './lib/prisma'

async function main() {
    try {
        console.log('Successfully imported prisma client')
        // Just try to connect or run a simple query if possible, but connection is enough to verify import
        await prisma.$connect()
        console.log('Successfully connected to database')
        // Log available models on the prisma client
        const models = Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$'));
        console.log('Available Prisma models:', models);

        console.log('Attempting to query users...')
        const users = await prisma.user.findMany({ take: 1 })
        console.log('Successfully queried users:', users)

        await prisma.$disconnect()
    } catch (e) {
        console.error('Error connecting to database:', e)
        process.exit(1)
    }
}

main()
