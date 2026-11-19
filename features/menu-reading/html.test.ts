import { expect, test } from "vitest";

import { htmlToText, imageUrlsIn } from "./html";

test("웹페이지에서 스크립트와 태그를 빼고 글만 남긴다", () => {
  const html = `<html><head><style>p{}</style><script>var a=1</script></head>
    <body><h1>11월 식단</h1><table><tr><td>11/23</td><td>현미밥, 감자국</td></tr></table>
    <p>맛있게&nbsp;드세요 &amp; 감사</p></body></html>`;
  const text = htmlToText(html);
  expect(text).toContain("11월 식단");
  expect(text).toContain("11/23");
  expect(text).toContain("현미밥, 감자국");
  expect(text).toContain("맛있게 드세요 & 감사");
  expect(text).not.toContain("var a");
  expect(text).not.toContain("p{}");
});

test("웹페이지의 이미지 주소를 절대 주소로 모은다 (가정 A11)", () => {
  const html = `<img src="/upload/menu1.jpg"><img alt="x" src='https://cdn.example.com/m2.png'>
    <meta property="og:image" content="https://cdn.example.com/og.jpg"><img src="data:image/png;base64,AAA">`;
  expect(imageUrlsIn(html, "https://blog.example.com/post/1")).toEqual([
    "https://cdn.example.com/og.jpg",
    "https://blog.example.com/upload/menu1.jpg",
    "https://cdn.example.com/m2.png",
  ]);
});
