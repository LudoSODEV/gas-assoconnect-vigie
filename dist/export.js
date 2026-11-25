module.exports = {
	alertFunctions: [
	{
		name: "CNESSansÉpicerie",
		fn: ((row) =>
{
	// 'Type de structure' contains '1_Partenaire'
	// 'Modes de distribution de l'aide alimentaire' does NOT contain 'Epicerie Sociale'
	// 'Le partenaire reçoit-il des produits CNES ?' starts with 'Oui'
	return row['Type de structure'].includes('1_Partenaire')
		&& !(row["Modes de distribution de l'aide alimentaire"].includes('Epicerie Sociale'))
		&& row['Le partenaire reçoit-il des produits CNES ?'].startsWith('Oui');
})
	},
	{
		name: "Catégorie2SansRéseauNational",
		fn: ((row) =>
{
	// 'Type de structure' contains '1_Partenaire'
	// 'Catégorie du partenaire' is 'Catégorie 2'
	// 'Appartient-il à un grand réseau ayant une habilitation nationale ?' does not start with (ANDES|Croix Rouge|Restos du Cœur|Secours Populaire|UGESS)
	return row['Type de structure'].includes('1_Partenaire')
		&& (row['Catégorie du partenaire'] === 'Catégorie 2')
		&& !(row['Appartient-il à un grand réseau ayant une habilitation nationale ?'].match(/^(ANDES|Croix Rouge|Restos du Cœur|Secours Populaire|UGESS)/));
})
	},
	{
		name: "CatégorieRéseauNational",
		fn: ((row) =>
{
	// 'Type de structure' contains '1_Partenaire'
	// 'Catégorie du partenaire' is NOT 'Catégorie 2'
	// 'Appartient-il à un grand réseau ayant une habilitation nationale ?' starts with (ANDES|Croix Rouge|Restos du Cœur|Secours Populaire|UGESS)
	return row['Type de structure'].includes('1_Partenaire')
		&& (row['Catégorie du partenaire'] !== 'Catégorie 2')
		&& row['Appartient-il à un grand réseau ayant une habilitation nationale ?'].match(/^(ANDES|Croix Rouge|Restos du Cœur|Secours Populaire|UGESS)/);
})
	},
	{
		name: "ColisSansFSE",
		fn: ((row) =>
{
	// 'Type de structure' contains '1_Partenaire'
	// 'Modes de distribution de l'aide alimentaire' contains 'Colis' or 'Repas'
	// 'Le partenaire reçoit-il des produits du FSE + ?' is 'Oui'
	return row['Type de structure'].includes('1_Partenaire')
		&& (row["Modes de distribution de l'aide alimentaire"].match(/Colis|Repas/))
		&& (row['Le partenaire reçoit-il des produits du FSE + ?'] === 'Oui');
})
	},
	{
		name: "ConventionDatesIncohérente",
		fn: ((row) =>
{
	// 'Type de structure' contains '1_Partenaire'
	// 'Date de la signature initiale de la convention / du contrat' is newer than 'Date de la dernière signature de la convention / du contrat'
	return row['Type de structure'].includes('1_Partenaire')
		&& (row['Date de la signature initiale de la convention / du contrat'] > row['Date de la dernière signature de la convention / du contrat']);
})
	},
	{
		name: "ConventionExpirée",
		fn: ((() =>
{
	const cutoffDate = new Date;
	cutoffDate.setFullYear(cutoffDate.getFullYear() - 5);

	return (row) =>
	{
		// 'Type de structure' contains '1_Partenaire'
		// 'Appartient-il à un grand réseau ayant une habilitation nationale ?' is NOT 'Croix Rouge'
		// 'Date de la dernière signature de la convention / du contrat' is older than 5 years ago
		return row['Type de structure'].includes('1_Partenaire')
			&& (row['Appartient-il à un grand réseau ayant une habilitation nationale ?'] !== 'Croix Rouge')
			&& (row['Date de la signature initiale de la convention / du contrat'] < cutoffDate);
	};
})())
	},
	{
		name: "HabilitationInvalide",
		fn: ((() =>
{
	const now = Date.now();

	return (row) =>
	{
		const network = row['Appartient-il à un grand réseau ayant une habilitation nationale ?'];

		// Is a CCAS/CIAS
		const isCCAS = (row['Statut'] === 'CCAS/CIAS');

		// Regional accreditation is valid and in the future
		const hasRegion = (+row["Oui - Date de fin de l'habilitation"] > now);

		// Is part of a network that has a national accrediation
		const isInNetwork = (network !== '') && (network !== '1- NON');

		// 'Type de structure' contains '1_Partenaire'
		// Not a 'CCAS/CIAS', no regional accreditation and no national network
		return row['Type de structure'].includes('1_Partenaire')
			&& !isCCAS && !hasRegion && !isInNetwork;
	};
})())
	},
	{
		name: "HabilitationRégionaleExpirée",
		fn: ((() =>
{
	const now = Date.now();

	return (row) =>
	{
		const date    = +row["Oui - Date de fin de l'habilitation"];
		const network = row['Appartient-il à un grand réseau ayant une habilitation nationale ?'];

		// Is a CCAS/CIAS
		const isCCAS = (row['Statut'] === 'CCAS/CIAS');

		// Regional accreditation is set
		const hasRegion = (date > 0);

		// Regional accreditation is in the past
		const regionIsExpired = (date < now);

		// Is part of a network that has a national accrediation
		const isInNetwork = (network !== '') && (network !== '1- NON');

		// 'Type de structure' contains '1_Partenaire'
		// Not a 'CCAS/CIAS', expired regional accreditation and no national network
		return row['Type de structure'].includes('1_Partenaire')
			&& !isCCAS && hasRegion && regionIsExpired &&  !isInNetwork;
	};
})())
	},
	{
		name: "HabilitationRégionaleIncohérente",
		fn: (row) =>
{
	const hasRegion = (row['Si non, a-t-il une habilitation régionale ?'] === 'Oui');
	const hasRegionDate = (row["Oui - Date de fin de l'habilitation"] > 0);

	return row['Type de structure'].includes('1_Partenaire') && (hasRegion !== hasRegionDate);
}
	},
	{
		name: "RenouvelerConvention",
		fn: ((() =>
{
	// Between ~5 and ~4.5 years ago
	const minDate = Date.now() - (5 * 365 * 24 * 60 * 60);
	const maxDate = Date.now() - (4.5 * 365 * 24 * 60 * 60);

	return (row) =>
	{
		// 'Type de structure' contains '1_Partenaire'
		// 'Appartient-il à un grand réseau ayant une habilitation nationale ?' is NOT 'Croix Rouge'
		// 'Date de la dernière signature de la convention / du contrat' is between than 4.5 and 5 years ago
		return row['Type de structure'].includes('1_Partenaire')
			&& (row['Appartient-il à un grand réseau ayant une habilitation nationale ?'] !== 'Croix Rouge')
			&& (date >= minDate)
			&& (date <= maxDate);
	};
})())
	},
	{
		name: "RenouvelerHabilitationRégionale",
		fn: ((() =>
{
	// Between now and ~6 months from now
	const minDate = Date.now();
	const maxDate = minDate + (6 * 30 * 24 * 60 * 60);

	return (row) =>
	{
		const network = row['Appartient-il à un grand réseau ayant une habilitation nationale ?'];
		const date = +row["Oui - Date de fin de l'habilitation"];

		// Is a CCAS/CIAS
		const isCCAS = (row['Statut'] === 'CCAS/CIAS');

		// Is part of a network that has a national accrediation
		const isInNetwork = (network !== '') && (network !== '1- NON');

		// 'Type de structure' contains '1_Partenaire'
		// 'Appartient-il à un grand réseau ayant une habilitation nationale ?' is NOT 'Croix Rouge'
		// 'Date de la dernière signature de la convention / du contrat' is between than 4.5 and 5 years ago
		return row['Type de structure'].includes('1_Partenaire')
			&& (date >= +minDate)
			&& (date <= +maxDate)
			&& !isCCAS
			&& !isInNetwork;
	};
})())
	},
	{
		name: "RéseauÉpicerieSansModeÉpicerie",
		fn: ((row) =>
{
	// 'Type de structure' contains '1_Partenaire'
	// 'Modes de distribution de l'aide alimentaire' does NOT contain 'Epicerie Sociale'
	// 'Appartient-il à un grand réseau ayant une habilitation nationale ?' starts with 'ANDES' or 'UGESS'
	return row['Type de structure'].includes('1_Partenaire')
		&& !(row["Modes de distribution de l'aide alimentaire"].includes('Epicerie Sociale'))
		&& (row['Appartient-il à un grand réseau ayant une habilitation nationale ?'].match(/^ANDES|^UGESS/));
})
	},
	{
		name: "SIRETInvalide",
		fn: ((row) =>
{
	if (!(row['Type de structure'].includes('1_Partenaire')))
	{
		return false;
	}

	const siret = String(row['Siret']);
	if (!(siret.match(/^[0-9]{14}$/)))
	{
		return false;
	}

	// Standard Luhn algorithm validation
	let sum = 0;
	for (let i = 0; i < 14; ++i)
	{
		let digit = parseInt(cleanedSiret.charAt(i), 10);
		if (i % 2 === 0)
		{
			digit *= 2;
			if (digit > 9)
			{
				digit -= 9;
			}
		}

		sum += digit;
	}

	return (sum % 10 === 0);
})
	},
	{
		name: "SansRelationPrésident",
		fn: ((row) =>
{
	// 'Type de structure' contains '1_Partenaire'
	// 'ID du Contact' has no associated 'Président'
	return row['Type de structure'].includes('1_Partenaire');
})
	},
	{
		name: "SansRelationRHYSA",
		fn: ((row) =>
{
	// 'Type de structure' contains '1_Partenaire'
	// 'ID du Contact' has no associated 'RHYSA'
	return row['Type de structure'].includes('1_Partenaire');
})
	},
	{
		name: "VisiteRecommandée",
		fn: ((() =>
{
	// 365 days ago
	const cutoffDate = Date.now() - (365 * 24 * 60 * 60);

	return (row) =>
	{
		// 'Type de structure' contains '1_Partenaire'
		// 'Date de la dernière visite' is older than the cutoff date
		return row['Type de structure'].includes('1_Partenaire')
			&& (+row['Date de la dernière visite'] <= cutoffDate);
	};
})())
	},
	{
		name: "ÉpicerieFSE",
		fn: ((row) =>
{
	// 'Type de structure' contains '1_Partenaire'
	// 'Modes de distribution de l'aide alimentaire' contains 'Epicerie Sociale'
	// 'Le partenaire reçoit-il des produits du FSE + ?' is 'Oui'
	return row['Type de structure'].includes('1_Partenaire')
		&& (row["Modes de distribution de l'aide alimentaire"].includes('Epicerie Sociale'))
		&& (row['Le partenaire reçoit-il des produits du FSE + ?'] === 'Oui');
})
	},
	{
		name: "ÉpicerieSansCNES",
		fn: ((row) =>
{
	// 'Type de structure' contains '1_Partenaire'
	// 'Modes de distribution de l'aide alimentaire' contains 'Epicerie Sociale'
	// 'Le partenaire reçoit-il des produits CNES ?' does NOT start with 'Oui'
	return row['Type de structure'].includes('1_Partenaire')
		&& (row["Modes de distribution de l'aide alimentaire"].includes('Epicerie Sociale'))
		&& !(row['Le partenaire reçoit-il des produits CNES ?'].startsWith('Oui'));
})
	},
	{
		name: "ÉquipementFraisManquant",
		fn: ((row) =>
{
	// 'Type de structure' contains '1_Partenaire'
	// 'Produits de la BA souhaités par le partenaire' contains 'Frais'
	// 'Equipements/Locaux' does NOT contain 'Chambre froide positive' or 'Réfrigérateur'
	return row['Type de structure'].includes('1_Partenaire')
		&& (row['Produits de la BA souhaités par le partenaire'].includes('Frais'))
		&& !(row['Equipements/Locaux'].match(/Chambre froide positive|Réfrigérateur/));
})
	},
	{
		name: "ÉquipementSurgeléManquant",
		fn: ((row) =>
{
	// 'Type de structure' contains '1_Partenaire'
	// 'Produits de la BA souhaités par le partenaire' contains 'Surgelé'
	// 'Equipements/Locaux' does NOT contain 'Chambre froide négative' or 'Congélateur'
	return row['Type de structure'].includes('1_Partenaire')
		&& (row['Produits de la BA souhaités par le partenaire'].includes('Surgelé'))
		&& !(row['Equipements/Locaux'].match(/Chambre froide négative|Congélateur/));
})
	}
	]
};
