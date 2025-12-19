function importApplovinData_fun() {
  var sheetName = "dump";
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) sheet = ss.insertSheet(sheetName);

  // Insert 10 new rows after header area
  sheet.insertRows(2,4);

  // Get yesterday's date
  var today = new Date();
  var yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  var formatDate = function(date) {
    return date.getFullYear() + "-" +
      ("0" + (date.getMonth() + 1)).slice(-2) + "-" +
      ("0" + date.getDate()).slice(-2);
  };

  var dateStr = formatDate(yesterday);

  // API call (updated columns)
  var apiKey = "DftwfXVSzT79M7JL0pteyICXTMTQs6lm9BHSXLDPXTLW3xSJl2L1ImOhWWCS9FgB11lv2Nw0L5ZOfm0hTUwTSV";
  var url =
    "https://r.applovin.com/maxReport?" +
    "start=" + dateStr +
    "&end=" + dateStr +
    "&format=csv" +
    "&columns=day,ad_format,requests,impressions,estimated_revenue,ecpm" +
    "&api_key=" + apiKey;

  var response = UrlFetchApp.fetch(url);
  var csvData = Utilities.parseCsv(response.getContentText());

  var headers = csvData[0];
  var rows = csvData.slice(1);

  // Index columns
  var idxDay = headers.indexOf("Day");
  var idxAd = headers.indexOf("Ad_format");
  var idxReq = headers.indexOf("Requests");
  var idxImp = headers.indexOf("Impressions");
  var idxRev = headers.indexOf("Estimated_revenue");
  var idxECPM = headers.indexOf("Ecpm");


  // Required ad formats
  var REQUIRED_AD_TYPES = ["BANNER", "INTER", "REWARD", "MREC"];

  // Build map: { Day → { Ad_Type → aggregatedData } }
  var dataMap = {};

  rows.forEach(function(r) {
    var day = r[idxDay];
    var ad = r[idxAd];

    if (!dataMap[day]) dataMap[day] = {};

    if (!dataMap[day][ad]) {
      dataMap[day][ad] = {
        requests: 0,
        impressions: 0,
        ecpm: 0,
        revenue: 0
        };
      }

    var entry = dataMap[day][ad];
    entry.requests += Number(r[idxReq] || 0);
    entry.impressions += Number(r[idxImp] || 0);
    entry.ecpm += Number(r[idxECPM] || 0);
    entry.revenue += Number(r[idxRev] || 0);
    entry.count++;
  });

  // Prepare final output rows
  var finalData = [];
  finalData.push([
    "Day",
    "Ad Format",
    "Requests",
    "Impressions",
    "eCPM",
    "Revenue"
  ]);

  Object.keys(dataMap).sort().forEach(function(day) {
    REQUIRED_AD_TYPES.forEach(function(type) {
      var d = dataMap[day][type];

      if (!d) {
        // Create 0-filled row if missing
        finalData.push([day, type, 0, 0, 0, 0, 0, 0]);
      } else {
        // Average calculated fields
        // var avgECPM = d.ecpm / d.count;
        // var avgDisplay = d.display_rate / d.count;
        // var avgShow = d.show_rate / d.count;

        finalData.push([
          day,
          type,
          d.requests,
          d.impressions,
          d.ecpm,
          d.revenue,
          // avgECPM,
          // avgDisplay,
          // avgShow,
        ]);
      }
    });
  });

  // Paste starting at row 2
  sheet.getRange(1, 1, finalData.length, finalData[0].length).setValues(finalData);

  Logger.log("Transformed Applovin data imported for: " + dateStr);
  Logger.log("Headers: " + headers);
}