<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  exclude-result-prefixes="sm">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8"/>
        <title>خريطة موقع سُنّة (XML)</title>
        <style>
          body{font-family:Tahoma,Arial,sans-serif;margin:1.5rem;background:#f7f3eb;color:#12201a}
          h1{font-size:1.25rem}
          table{border-collapse:collapse;width:100%;background:#fff}
          th,td{border:1px solid #d7e0db;padding:.45rem .6rem;text-align:start;font-size:.9rem}
          th{background:#e7f1ec}
          .meta{color:#3d5248;margin-bottom:1rem}
        </style>
      </head>
      <body>
        <h1>خريطة موقع سُنّة — sitemap.xml</h1>
        <p class="meta">ملف XML صالح لمحركات البحث. عدد الروابط: <xsl:value-of select="count(sm:urlset/sm:url)"/>.</p>
        <table>
          <thead>
            <tr><th>الرابط</th><th>آخر تعديل</th><th>التكرار</th><th>الأولوية</th></tr>
          </thead>
          <tbody>
            <xsl:for-each select="sm:urlset/sm:url">
              <tr>
                <td><a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a></td>
                <td><xsl:value-of select="sm:lastmod"/></td>
                <td><xsl:value-of select="sm:changefreq"/></td>
                <td><xsl:value-of select="sm:priority"/></td>
              </tr>
            </xsl:for-each>
          </tbody>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
