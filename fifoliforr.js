import fs from 'fs';

async function readCSV(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');
    const rows = data.split('\n').slice(1);
    
    //const firstRow = rows[0].split(',').map(item => item.trim());
    //const quantum = parseInt(firstRow[3]);

    const activities = rows.map(row => {
        const [name, ti, t] = row.split(',').map(item => item.trim());
        return { name, ti: parseInt(ti), t: parseInt(t) };
    });

    return { activities };
}

const printTable = (algorithm, results) => {
    console.log(algorithm)
    console.log("|| --------------------------------------------------- ||");
    console.log("||  ID  || ti ||  t  ||  tf  ||  T   ||   E  ||   I    ||");
    console.log("|| --------------------------------------------------- ||");
        
    
    results.forEach(({ name, ti, t, tf, T, E, I }) => {
        //clock = Math.max(clock, tf);
        console.log(`|| ${name.padEnd(4)} || ${ti.toString().padStart(2)} || ${t.toString().padStart(3)} || ${tf.toString().padStart(4)} || ${T.toString().padStart(4)} || ${E.toString().padStart(4)} || ${I.toFixed(4)} ||`);
    });
        
    console.log("|| ----------------------------------------------------||\n");
}

function fifo(ActNames, initialTime, time) {
    const clock = ['clock'];
    const numberAct = ActNames.length;
    const names = [...ActNames];
    const Ti = [...initialTime];
    const t = [...time];
    const calcTi = [...Ti];
    const Tf = new Array(numberAct).fill(null);
    const T = new Array(numberAct).fill(null);
    const E = new Array(numberAct).fill(null);
    const I = new Array(numberAct).fill(null);
    let c = Math.min(...Ti);
    clock.push(c);
    let x = 0;
    let sumT = 0, sumE = 0, sumI = 0;

    while (x < numberAct) {
        for (let i = 0; i < numberAct; i++) {
            if (calcTi[i] !== null && c >= calcTi[i]) {
                Tf[i] = c + t[i];
                c = Tf[i];
                clock.push(c);
                calcTi[i] = null;
                T[i] = Tf[i] - Ti[i];
                sumT += T[i];
                E[i] = T[i] - t[i];
                sumE += E[i];
                I[i] = t[i] / (Tf[i] - Ti[i]);
                sumI += I[i];
                break;
            }
        }
        x++;
    }

    const results = names.map((name, index) => ({
        name,
        ti: Ti[index],
        t: t[index],
        tf: Tf[index],
        T: T[index],
        E: E[index],
        I: I[index]
    }));

    printTable('FIFO', results);

    const avgT = sumT / numberAct;
    const avgE = sumE / numberAct;
    const avgI = sumI / numberAct;

    console.log(`El promedio del Tiempo Total es ${avgT.toFixed(3)}`);
    console.log(`El promedio del Tiempo de Espera es ${avgE.toFixed(3)}`);
    console.log(`El promedio de Indice de Servicios es ${avgI.toFixed(4)}`);
    //const totalAvg = avgE + avgI + avgT;


    return { c, avgI };
}

function lifo(ActNames, initialTime, time) {
    const clock = ['clock'];
    const numberAct = ActNames.length;
    const names = [...ActNames];
    const Ti = [...initialTime];
    const t = [...time];
    let calcTi = [...Ti];
    let calct = [...t];
    calcTi.reverse();
    calct.reverse();
    const Tf = new Array(numberAct).fill(null);
    const T = new Array(numberAct).fill(null);
    const E = new Array(numberAct).fill(null);
    const I = new Array(numberAct).fill(null);
    let c = Math.min(...Ti);
    clock.push(c);
    let x = 0;
    let sumT = 0, sumE = 0, sumI = 0;

    while (x < numberAct) {
        for (let i = 0; i < numberAct; i++) {
            if (calcTi[i] !== null && c >= calcTi[i]) {
                Tf[i] = c + calct[i];
                c = Tf[i];
                clock.push(c);
                calcTi[i] = null;
                break;
            }
        }
        x++;
    }

    Tf.reverse();
    for (let j = 0; j < numberAct; j++) {
        T[j] = Tf[j] - Ti[j];
        sumT += T[j];
        E[j] = T[j] - t[j];
        sumE += E[j];
        I[j] = t[j] / T[j];
        sumI += I[j];
    }

    const results = names.map((name, index) => ({
        name,
        ti: Ti[index],
        t: t[index],
        tf: Tf[index],
        T: T[index],
        E: E[index],
        I: I[index]
    }));

    printTable('LIFO', results);

    const avgT = sumT / numberAct;
    const avgE = sumE / numberAct;
    const avgI = sumI / numberAct;

    console.log(`El promedio del Tiempo Total es ${avgT.toFixed(4)}`);
    console.log(`El promedio del Tiempo de Espera es ${avgE.toFixed(4)}`);
    console.log(`El promedio del Indice de Servicios es ${avgI.toFixed(4)}`);
    //const totalAvg = avgE + avgI + avgT;


    return { c,avgI }
}

function RoundRobin(ActNames, initialTime, time, q) {
    const clock = ['clock'];
    const numberAct = ActNames.length;
    const names = [...ActNames];
    const Ti = [...initialTime];
    const t = [...time];
    const calct = [...t];   
    const Tf = new Array(numberAct).fill(null);
    const T = new Array(numberAct).fill(null);
    const E = new Array(numberAct).fill(null);
    const I = new Array(numberAct).fill(null);
    let c = Math.min(...Ti);
    clock.push(c);

    let sumT = 0, sumE = 0, sumI = 0;
    while (calct.reduce((a, b) => a + b, 0) > 0) {
        for (let i = 0; i < numberAct; i++) {
            if (calct[i] > 0) {
                if (calct[i] <= q) {
                    c += calct[i];
                    clock.push(c);
                    Tf[i] = c;
                    calct[i] = 0;   
                } else {
                    c += q;
                    clock.push(c);
                    calct[i] -= q;
                }
            }
        }
    }

    for (let j = 0; j < numberAct; j++) {
        T[j] = Tf[j] - Ti[j];
        E[j] = T[j] - t[j];
        I[j] = t[j] / T[j];
        sumT += T[j];
        sumE += E[j];
        sumI += I[j];
    }

    const results = names.map((name, index) => ({
        name,
        ti: Ti[index],
        t: t[index],
        tf: Tf[index],
        T: T[index],
        E: E[index],
        I: I[index]
    }));

    printTable('Round Robin', results);

    const avgT = sumT / numberAct;
    const avgE = sumE / numberAct;
    const avgI = sumI / numberAct;

    console.log(`El promedio del Tiempo Total es ${avgT.toFixed(4)}`);
    console.log(`El promedio del Tiempo de Espera es ${avgE.toFixed(4)}`);
    console.log(`El promedio de Indice de Servicios es ${avgI.toFixed(4)}`);
    //const totalAvg = avgE + avgI + avgT;

    return { c, avgI }
}

(async () => {
    //modificar dependiendo del quantum a medir
    const quantum = 4
    const { activities } = await readCSV('file.csv');
    const nombres = activities.map(activity => activity.name);
    const Ti = activities.map(activity => activity.ti);
    const t = activities.map(activity => activity.t);

    console.time('tiempo de ejecucion FIFO');
    const ResultsFIFO = fifo(nombres, Ti, t);
    console.timeEnd('tiempo de ejecucion FIFO');

    console.log("\n");

    console.time('tiempo de ejecucion LIFO');
    const ResultsLIFO = lifo(nombres, Ti, t);
    console.timeEnd('tiempo de ejecucion LIFO');

    console.log("\n");

    console.time('tiempo de ejecucion Round Robin');
    const ResultsRR = RoundRobin(nombres, Ti, t, quantum);
    console.timeEnd('tiempo de ejecucion Round Robin');


    
    console.log(`\nClock con FIFO ${ResultsFIFO.c}, Clock con LIFO ${ResultsLIFO.c}, Clock con RR ${ResultsRR.c}`);
    

    console.log('El mejor algoritmo con respecto al Indice de Servicios (I) es:')
    if (ResultsFIFO.avgI > ResultsLIFO.avgI && ResultsFIFO.avgI > ResultsRR.avgI) {
        console.log('FIFO')
        console.log('Con un indice de promedio de servicios de: ', ResultsFIFO.avgI.toFixed(4))
    } else if (ResultsLIFO.avgI > ResultsFIFO.avgI && ResultsLIFO.avgI > ResultsRR.avgI) {
        console.log('LIFO')
        console.log('Con un indice de promedio de servicios de: ', ResultsLIFO.avgI.toFixed(4))
    } else {
        console.log('Round Robin')
        console.log('Con un indice de promedio de servicios de: ', ResultsRR.avgI.toFixed(4))
    }

})();
