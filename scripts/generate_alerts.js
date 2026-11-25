const fs = require('fs');
const path = require('path');
const toml = require('@iarna/toml');
const { generateMasterFormula } = require('../src/Setup');

const alertsDir = path.join(__dirname, '..', 'src', 'alerts');
const outputFile = path.join(__dirname, '..', 'src', 'Alerts.js');
const exportFile = path.join(__dirname, '..', 'dist', 'export.js');

const files = fs.readdirSync(alertsDir).filter(file => file.endsWith('.toml'));

const alerts = files.map(file =>
{
	const filePath = path.join(alertsDir, file);
	const content = fs.readFileSync(filePath, 'utf-8');
	const parsed = toml.parse(content);
	const sheetName = 'Alert-' + path.basename(file, '.toml');
	return { name: path.basename(file, '.toml'), sheetName, ...parsed };
});

// Mock getAlerts for the Setup.js dependency
function getAlerts()
{
	return alerts;
}

// Attach mock to global scope if needed, or re-factor Setup.js to accept alerts
global.getAlerts = getAlerts;

const masterFormula = generateMasterFormula();

const outputContent = `function getAlerts()
{
	return ${JSON.stringify(alerts, null, '\t')};
}

function getMasterFormula()
{
	return ${JSON.stringify(masterFormula)};
}
`;

fs.writeFileSync(outputFile, outputContent);
console.log(`Generated ${outputFile} with ${alerts.length} alerts and master formula.`);

const exportDir = path.dirname(exportFile);
if (!fs.existsSync(exportDir))
{
	fs.mkdirSync(exportDir, { recursive: true });
}

const exportAllEntries = alerts.map(alert =>
{
	return `\t{\n\t\tname: ${JSON.stringify(alert.name)},\n\t\tfn: ${alert.js.trim()}\n\t}`;
}).join(',\n');

const exportContent = `module.exports = {
\talertFunctions: [
${exportAllEntries}
\t]
};
`;

fs.writeFileSync(exportFile, exportContent);
console.log(`Generated ${exportFile} with ${alerts.length} exported alert functions.`);
