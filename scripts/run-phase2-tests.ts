/**
 * Phase 2 Comprehensive Test Suite
 * Covers Sections 49, 50, and 51:
 * - File Security & Path Traversal Sanitization
 * - UTF-8 BOM Header Handling
 * - CSV Streaming & Quoting Integrity
 * - Duplicate & Empty Header Handling
 * - Section 50: Critical Golden Regression Test
 * - Section 22-29: Column Detection & Heuristic Scoring
 * - Section 45: Dataset Integrity & Row-for-Row Persistence
 * - Section 51: 10,000 Rows x 20 Columns Performance Benchmark
 */

import fs from 'fs';
import path from 'path';
import { sanitizeUploadedFile, isCsvFile } from '../src/server/utils/fileSanitizer.js';
import { getCsvParserService } from '../src/server/services/csvParserService.js';
import { getColumnAnalyzerService } from '../src/server/services/columnAnalyzerService.js';
import { getDatasetService } from '../src/server/services/datasetService.js';
import config from '../src/server/config/index.js';

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTest(category: string, name: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  try {
    await fn();
    results.push({
      category,
      name,
      passed: true,
      durationMs: Date.now() - start
    });
    console.log(`  ✓ [${category}] ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({
      category,
      name,
      passed: false,
      message: err.message,
      durationMs: Date.now() - start
    });
    console.error(`  ✕ [${category}] ${name}: ${err.message}`);
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING PHASE 2 COMPREHENSIVE AUTOMATED TEST SUITE');
  console.log('======================================================\n');

  const tempDir = config.tempDir;
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // -------------------------------------------------------------
  // Test 1: File Sanitization & Directory Traversal Protection
  // -------------------------------------------------------------
  await runTest('Security', 'Filename sanitization blocks directory traversal', () => {
    const malicious = '../../../../etc/passwd/malicious.csv';
    const sanitized = sanitizeUploadedFile(malicious);
    assert(!sanitized.storedFileName.includes('..'), 'Stored filename must not contain ".."');
    assert(sanitized.originalFileName === 'malicious.csv', 'Original filename should be stripped of paths');
    assert(sanitized.storedFilePath.startsWith(config.uploadDir), 'File must reside in uploadDir');
  });

  await runTest('Security', 'File type detection accepts CSV and rejects binaries', () => {
    assert(isCsvFile('blogs.csv', 'text/csv'), 'blogs.csv must be accepted');
    assert(isCsvFile('data.CSV', 'application/vnd.ms-excel'), 'data.CSV must be accepted');
    assert(!isCsvFile('malware.exe', 'application/x-msdownload'), 'exe must be rejected');
    assert(!isCsvFile('script.sh', 'text/x-sh'), 'sh script must be rejected');
  });

  // -------------------------------------------------------------
  // Test 2: UTF-8 BOM Handling (Section 10)
  // -------------------------------------------------------------
  await runTest('Encoding', 'UTF-8 BOM (EF BB BF) is stripped without corrupting column name', async () => {
    const bomFilePath = path.join(tempDir, 'test_bom.csv');
    // Write UTF-8 BOM followed by CSV
    const bomBuffer = Buffer.from([0xef, 0xbb, 0xbf]);
    const csvContent = Buffer.from('ID,Title,Content\n1,"BOM Post","BOM Content"\n');
    fs.writeFileSync(bomFilePath, Buffer.concat([bomBuffer, csvContent]));

    const parser = getCsvParserService();
    const res = await parser.parseFile(bomFilePath);

    assert(res.originalHeaders[0] === 'ID', `First header must be "ID", got: "${res.originalHeaders[0]}"`);
    assert(res.originalHeaders[1] === 'Title', 'Second header must be "Title"');
    assert(res.originalHeaders[2] === 'Content', 'Third header must be "Content"');
    assert(res.totalRows === 1, 'Total rows should be 1');

    fs.unlinkSync(bomFilePath);
  });

  // -------------------------------------------------------------
  // Test 3: Duplicate and Empty Headers (Section 13, 14)
  // -------------------------------------------------------------
  await runTest('Headers', 'Duplicate and empty column headers are handled deterministically', () => {
    const parser = getCsvParserService();
    const rawHeaders = ['ID', 'Title', 'Title', '', 'Content'];
    const resolved = parser.resolveHeaders(rawHeaders);

    assert(resolved.originalHeaders.length === 5, 'Original headers preserved');
    assert(resolved.internalHeaders[0] === 'ID', 'ID preserved');
    assert(resolved.internalHeaders[1] === 'Title', 'First Title preserved');
    assert(resolved.internalHeaders[2] === 'Title__2', 'Duplicate Title disambiguated to Title__2');
    assert(resolved.internalHeaders[3] === '__unnamed_4', 'Empty header resolved to __unnamed_4');
    assert(resolved.internalHeaders[4] === 'Content', 'Content preserved');
    assert(resolved.duplicateCount === 1, 'Duplicate count counted');
    assert(resolved.emptyHeaderCount === 1, 'Empty header counted');
  });

  // -------------------------------------------------------------
  // Test 4: Section 50 Critical Golden Regression Test
  // -------------------------------------------------------------
  await runTest('Golden Test', 'Section 50 Critical Fixture: Quotes, commas, multiline paragraphs, Hindi & Japanese', async () => {
    const goldenFilePath = path.join(tempDir, 'golden_fixture.csv');
    const goldenContent = `ID,Blog Title,Main Content,Blog URL,Notes
001,"SEO, Strategy Guide","This is paragraph one.

This is paragraph two, which contains a comma.

He said ""SEO is important"".","https://example.com/blog/seo","日本語テスト"
002,"Another Blog","Content with
multiple
lines","https://example.com/blog/2","हिंदी परीक्षण"
003,"Zero Lead Test","Cell with numeric string","https://example.com/","00123"`;

    fs.writeFileSync(goldenFilePath, goldenContent, 'utf-8');

    const parser = getCsvParserService();
    const parseResult = await parser.parseFile(goldenFilePath);

    assert(parseResult.totalRows === 3, `Expected 3 rows, got ${parseResult.totalRows}`);
    assert(parseResult.originalHeaders.length === 5, 'Expected 5 headers');

    // Row 0 assertions
    const row0 = parseResult.rows[0].originalData;
    assert(row0['ID'] === '001', `Expected ID="001", got "${row0['ID']}"`);
    assert(row0['Blog Title'] === 'SEO, Strategy Guide', 'Commas inside quotes preserved');
    assert(row0['Main Content'].includes('paragraph one.'), 'Paragraph 1 preserved');
    assert(row0['Main Content'].includes('He said "SEO is important".'), 'Escaped quotes preserved');
    assert(row0['Blog URL'] === 'https://example.com/blog/seo', 'URL preserved');
    assert(row0['Notes'] === '日本語テスト', 'Japanese Unicode preserved');

    // Row 1 assertions
    const row1 = parseResult.rows[1].originalData;
    assert(row1['Main Content'].includes('\nmultiple\nlines'), 'Embedded newlines preserved');
    assert(row1['Notes'] === 'हिंदी परीक्षण', 'Hindi Unicode preserved');

    // Row 2 assertions
    const row2 = parseResult.rows[2].originalData;
    assert(row2['Notes'] === '00123', 'Leading zeroes string preserved without numeric casting');

    fs.unlinkSync(goldenFilePath);
  });

  // -------------------------------------------------------------
  // Test 5: Dynamic Column Analysis & Heuristics (Section 22-29)
  // -------------------------------------------------------------
  await runTest('Analysis', 'ColumnAnalyzer detects URLs, IDs, Long Text, and generates human-readable reasons', () => {
    const analyzer = getColumnAnalyzerService();

    // 1. URL column
    const urlCol = analyzer.analyzeColumn({
      index: 0,
      internalName: 'Blog URL',
      originalName: 'Blog URL',
      values: ['https://example.com/p1', 'https://example.com/p2', 'https://example.com/p3'],
      totalRows: 3
    });
    assert(urlCol.inferredType === 'URL', `Expected URL type, got ${urlCol.inferredType}`);
    assert(!urlCol.recommendedForProcessing, 'URL should NOT be recommended for processing');
    assert(urlCol.reason.includes('URL'), 'Reason should mention URL');

    // 2. ID column
    const idCol = analyzer.analyzeColumn({
      index: 1,
      internalName: 'record_id',
      originalName: 'record_id',
      values: ['uuid-001', 'uuid-002', 'uuid-003'],
      totalRows: 3
    });
    assert(!idCol.recommendedForProcessing, 'ID column should NOT be recommended for processing');
    assert(idCol.reason.includes('identifier'), 'Reason should mention identifier');

    // 3. Long Text column
    const longTextCol = analyzer.analyzeColumn({
      index: 2,
      internalName: 'Main Content',
      originalName: 'Main Content',
      values: [
        'This is an extensive in-depth guide to technical website optimization.\n\nIt covers crawl budgets, server response latency, Core Web Vitals, and structured schema markup.',
        'Another substantial article exploring artificial intelligence workflows.\n\nIt details how human-in-the-loop editors ensure factual accuracy and brand voice alignment.'
      ],
      totalRows: 2
    });
    assert(longTextCol.inferredType === 'LONG_TEXT', `Expected LONG_TEXT, got ${longTextCol.inferredType}`);
    assert(longTextCol.recommendedForProcessing === true, 'Long text should be recommended for processing');
    assert(longTextCol.contentScore >= 0.7, `Expected high content score >= 0.7, got ${longTextCol.contentScore}`);
    assert(longTextCol.reason.length > 10, 'Reason should be detailed');
  });

  // -------------------------------------------------------------
  // Test 6: Full Ingestion Service with Transactional Integrity (Section 20, 21, 45)
  // -------------------------------------------------------------
  await runTest('Integration', 'DatasetService performs streaming ingestion, row persistence & integrity verification', async () => {
    const testCsv = path.join(tempDir, 'integration_sample.csv');
    const content = `id,Title,Content,Category,PublishedAt
1,"Blog One","First full blog article body.","Tech","2026-09-23"
2,"Blog Two","Second full blog article body.","Design","2026-09-24"
3,"Blog Three","Third full blog article body.","Marketing","2026-09-25"`;

    fs.writeFileSync(testCsv, content, 'utf-8');

    const datasetService = getDatasetService();
    const dataset = await datasetService.ingestCsvFile({
      clientFilename: 'integration_sample.csv',
      tempFilePath: testCsv,
      fileSize: Buffer.byteLength(content)
    });

    assert(dataset.status === 'READY', `Dataset status should be READY, got: ${dataset.status}`);
    assert(dataset.totalRows === 3, `Expected 3 rows, got: ${dataset.totalRows}`);
    assert(dataset.totalColumns === 5, `Expected 5 columns, got: ${dataset.totalColumns}`);

    // Verify row retrieval with pagination
    const paginated = await datasetService.getDatasetRows(dataset.id, 1, 10);
    assert(paginated.rows.length === 3, 'All 3 rows retrieved');
    assert(paginated.pagination.totalRows === 3, 'Total rows in pagination is 3');
    assert(paginated.rows[0].originalData['Title'] === 'Blog One', 'Row 0 Title matches');
    assert(paginated.rows[1].originalData['Title'] === 'Blog Two', 'Row 1 Title matches');
    assert(paginated.rows[2].originalData['Title'] === 'Blog Three', 'Row 2 Title matches');

    fs.unlinkSync(testCsv);
  });

  // -------------------------------------------------------------
  // Test 7: Section 51 Performance Benchmark (10,000 Rows x 20 Columns)
  // -------------------------------------------------------------
  await runTest('Performance', 'Section 51: Streaming ingestion of 10,000 rows x 20 columns without memory exhaustion', async () => {
    const perfFilePath = path.join(tempDir, 'perf_10k.csv');
    console.log('     Generating 10,000 rows x 20 columns fixture...');
    const writeStart = Date.now();

    const stream = fs.createWriteStream(perfFilePath);
    const headers = Array.from({ length: 20 }, (_, i) => `Col_${i + 1}`);
    headers[0] = 'ID';
    headers[1] = 'Blog Title';
    headers[2] = 'Main Content';
    headers[3] = 'Blog URL';
    stream.write(headers.join(',') + '\n');

    const totalRows = 10000;
    for (let i = 0; i < totalRows; i++) {
      const row = [
        String(i + 1),
        `"Top Tips for SEO Strategy - Edition #${i + 1}"`,
        `"Comprehensive article content for row ${i + 1}. Contains commas, formatting, and structured paragraphs.\n\nSecond paragraph elaboration."`,
        `"https://example.com/blog/post-${i + 1}"`,
        ...Array.from({ length: 16 }, (_, j) => `"MetaVal_${i}_${j}"`)
      ];
      stream.write(row.join(',') + '\n');
    }

    await new Promise((res) => stream.end(res));
    const genTime = Date.now() - writeStart;
    const stats = fs.statSync(perfFilePath);
    console.log(`     Fixture generated in ${genTime}ms. File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    const parseStart = Date.now();
    const datasetService = getDatasetService();
    const dataset = await datasetService.ingestCsvFile({
      clientFilename: 'perf_10k.csv',
      tempFilePath: perfFilePath,
      fileSize: stats.size
    });
    const totalTime = Date.now() - parseStart;

    console.log(`     Ingested and analyzed 10,000 rows x 20 columns in ${totalTime}ms (~${Math.round(totalRows / (totalTime / 1000))} rows/sec)`);

    assert(dataset.status === 'READY', '10k dataset must be READY');
    assert(dataset.totalRows === 10000, `Expected 10,000 rows, got ${dataset.totalRows}`);
    assert(dataset.totalColumns === 20, `Expected 20 columns, got ${dataset.totalColumns}`);

    // Verify first page and last page of 10,000 rows
    const firstPage = await datasetService.getDatasetRows(dataset.id, 1, 50);
    assert(firstPage.rows.length === 50, 'Page 1 has 50 rows');
    assert(firstPage.pagination.totalPages === 200, '10,000 rows / 50 per page = 200 pages');

    const lastPage = await datasetService.getDatasetRows(dataset.id, 200, 50);
    assert(lastPage.rows.length === 50, 'Last page has 50 rows');
    assert(lastPage.rows[49].originalData['ID'] === '10000', 'Row 10,000 preserved correctly');

    fs.unlinkSync(perfFilePath);
  });

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n======================================================');
  console.log('📊 TEST EXECUTION SUMMARY');
  console.log('======================================================');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total Tests Run : ${results.length}`);
  console.log(`Passed         : ${passed}`);
  console.log(`Failed         : ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
