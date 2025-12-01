import prisma from './lib/prisma'

async function main() {
    try {
        console.log('Successfully imported prisma client')
        // Just try to connect or run a simple query if possible, but connection is enough to verify import
        await prisma.$connect()
        console.log('Successfully connected to database')
        await prisma.$disconnect()
    } catch (e) {
        console.error('Error connecting to database:', e)
        process.exit(1)
    }
}

main()
