let count = 0;

setInterval(() => {

    console.log('iteration', count);

    if (count > 9) {
        console.log('\x1b[31mNOK');
        process.exit(1);
    }
    count++;
}, 1000);
