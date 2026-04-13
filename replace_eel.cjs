const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/await window\.eel\.(\w+)\(([^)]*)\)\(\)/g, (match, methodName, args) => {
    if (args.trim() === '') {
         return `await callEel<[], any>('${methodName}')`;
    }
    // Very simple typings, fallback to any
    const typedArgs = args.split(',').map(arg => 'any').join(', ');
    return `await callEel<[${typedArgs}], any>('${methodName}', ${args})`;
});

fs.writeFileSync('src/App.tsx', content);
