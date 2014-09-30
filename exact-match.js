/**
 * exact-match.js
 * @author Mark Schad
 * @description Restores exact match functionality in google adwords by way of
 * negative keywords.
 */

function adGroupAddNegative(adGroupId, keyword) {

	var iterator = AdWordsApp.adGroups()
		.withIds([adGroupId])
		.get();

	if (iterator.hasNext()) {

		var adGroup = iterator.next();
		adGroup.createNegativeKeyword('[' + keyword + ']');
		Logger.log('Added negative keyword [' + keyword + '] to AdGroup "' + adGroup.getName() + '"');

	}
	else
		Logger.log('AdGroup with ID "' + adGroupId + '" does not exist.');

}

function campaignAddNegative(campaignId, keyword) {

	var iterator = AdWordsApp.campaigns()
		.withIds([campaignId])
		.get();

	if (iterator.hasNext()) {

		var campaign = iterator.next();
		campaign.createNegativeKeyword('[' + keyword + ']');
		Logger.log('Added negative keyword [' + keyword + '] to Campaign "' + campaign.getName() + '"');

	}
	else
		Logger.log('Campaign with ID "' + campaignId + '" does not exist.');

}


function main() {
	
	var AD_GROUP_LEVEL = true
		, CAMPAIGN_LEVEL = true

		, AD_GROUP_FILTERS = ''
		, CAMPAIGN_FILTERS = '';

	// Collection of keywords that we want to match exactly.
	var exactKeywordCollection = [];

	var report, iterator, row;

	// Retrieve a list of all exact-match keywords.
	report = AdWordsApp.report(
		'SELECT AdGroupId, Id ' +
		'FROM KEYWORDS_PERFORMANCE_REPORT ' +
		'WHERE Impressions > 0 AND KeywordMatchType = EXACT ' +
		'DURING LAST_7_DAYS');
	iterator = report.rows();

	while (iterator.hasNext()) {
		row = iterator.next();
		exactKeywordCollection.push(row.Id + '#' + row.AdGroupId);
	}

	// Retrieve a list of all exact-match close-variant keywords.
	report = AdWordsApp.report(
		'SELECT Query, AdGroupId, CampaignId, KeywordId, KeywordTextMatchingQuery, Impressions, MatchType ' +
		'FROM SEARCH_QUERY_PERFORMANCE_REPORT ' +
		//'WHERE CampaignName CONTAINS_IGNORE_CASE "' + CAMPAIGN_FILTERS + '" ' +
		//'AND AdGroupName CONTAINS_IGNORE_CASE  "' + AD_GROUP_FILTERS + '" ' +
		'DURING THIS_MONTH');
	iterator = report.rows();

	while (iterator.hasNext()) {
		row = iterator.next();

		var keywordIsQuery = row.KeywordTextMatchingQuery === row.Query;
		var isCloseVariant = row.MatchType.toLowerCase().indexOf('exact (close variant)') >= 0;
		var isExactMatch = exactKeywordCollection.indexOf(row.KeywordId + '#' + row.AdGroupId) >= 0;
	  
		// If the row is a keyword that is not the same as the search query and of match type
		// 'close variant', then add it to the list of keywords to exclude.
		if (!keywordIsQuery && isCloseVariant && !isExactMatch) {
		  
		  var normalisedKeyword = row.KeywordTextMatchingQuery.replace(/[^\w\s]/gi, '');
		  
		  Logger.log('Found variant for [' + row.Query + ']: ' + normalisedKeyword);

			if (AD_GROUP_LEVEL)
				adGroupAddNegative(row.AdGroupId, normalisedKeyword);

			if (CAMPAIGN_LEVEL)
				campaignAddNegative(row.CampaignId, normalisedKeyword);

		}

	}

}