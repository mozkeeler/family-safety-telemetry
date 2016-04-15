"use strict";

function processHistogram(aggregatedHistogram, histogram, i, date) {
  for (let i in histogram.values) {
    if (!aggregatedHistogram.values[i]) {
      aggregatedHistogram.values[i] = 0;
    }
    aggregatedHistogram.values[i] += histogram.values[i];
  }
  aggregatedHistogram.submissions += histogram.submissions;
  let processed = crunchHistogramNumbers(histogram);
  appendRates(processed, date.toISOString(), histogram.submissions);
}

function formatPercentage(numerator, denominator) {
  if (denominator == 0 && numerator == 0) {
    return "0";
  }

  let str = (numerator / denominator * 100).toString();
  let decimal = str.indexOf(".");
  if (decimal < 0) {
    return str;
  }
  return str.substr(0, decimal + 3);
}

function Fraction(numerator, denominator) {
  this.numerator = numerator;
  this.denominator = denominator;
}

Fraction.prototype = {
  toString: function() {
    let percentage = formatPercentage(this.numerator, this.denominator);
    return `${this.numerator}/${this.denominator} (${percentage}%)`;
  },
};

function crunchHistogramNumbers(histogram) {
  // bucket 0 == disabled
  // bucket 1 == detect only
  // bucket 2 == detect and import
  let disabledCount = histogram.values[0];
  let detectCount = histogram.values[1];
  let importCount = histogram.values[2];
  let prefTotal =  disabledCount + detectCount + importCount;

  // bucket 3 == failed to detect
  let detectionFailureRate = new Fraction(histogram.values[3], detectCount + importCount);

  // bucket 4 == Family Safety not enabled
  // bucket 5 == Family Safety enabled
  let familySafetyEnabledRate = new Fraction(histogram.values[5],
                                             histogram.values[4] + histogram.values[5]);

  // bucket 6 = failed to import root
  // bucket 7 = imported root successfully
  let importSuccessRate = new Fraction(histogram.values[7],
                                       histogram.values[6] + histogram.values[7]);
  return {
    disabled: new Fraction(disabledCount, prefTotal),
    detectOnly: new Fraction(detectCount, prefTotal),
    detectAndImport: new Fraction(importCount, prefTotal),
    detectionFailureRate: detectionFailureRate,
    familySafetyEnabledRate: familySafetyEnabledRate,
    importSuccessRate: importSuccessRate,
  };
}

function appendRates(processedHistogram, dateString, volume) {
  let table = document.getElementById("table");
  let tr = document.createElement("tr");
  let dateTD = document.createElement("td");
  dateTD.textContent = dateString;
  tr.appendChild(dateTD);
  let volumeTD = document.createElement("td");
  volumeTD.textContent = volume;
  tr.appendChild(volumeTD);
  let disabledTD = document.createElement("td");
  disabledTD.textContent = processedHistogram.disabled.toString();
  tr.appendChild(disabledTD);
  let detectOnlyTD = document.createElement("td");
  detectOnlyTD.textContent = processedHistogram.detectOnly.toString();
  tr.appendChild(detectOnlyTD);
  let detectAndImportTD = document.createElement("td");
  detectAndImportTD.textContent = processedHistogram.detectAndImport.toString();
  tr.appendChild(detectAndImportTD);

  let detectionFailureRateTD = document.createElement("td");
  detectionFailureRateTD.textContent = processedHistogram.detectionFailureRate.toString();
  tr.appendChild(detectionFailureRateTD);
  let familySafetyEnabledRateTD = document.createElement("td");
  familySafetyEnabledRateTD.textContent = processedHistogram.familySafetyEnabledRate.toString();
  tr.appendChild(familySafetyEnabledRateTD);
  let importSuccessRateTD = document.createElement("td");
  importSuccessRateTD.textContent = processedHistogram.importSuccessRate.toString();
  tr.appendChild(importSuccessRateTD);
  table.appendChild(tr);
}

function processEvolution(evolutionMap) {
  let aggregatedHistogram = { values: [], submissions: 0 };
  evolutionMap[""].map(processHistogram.bind(this, aggregatedHistogram)); // wtf?
  let processed = crunchHistogramNumbers(aggregatedHistogram);
  appendRates(processed, "total", aggregatedHistogram.submissions);
}

function main() {
  Telemetry.getEvolution("nightly", "48", "FAMILY_SAFETY", {}, false, processEvolution);
}

Telemetry.init(main);
