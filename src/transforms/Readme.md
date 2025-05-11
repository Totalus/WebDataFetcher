# Transformations Reference

This document describes all available transformations in WebDataFetcher, their options, expected types, and usage examples.

---

## Table of Contents

| Transformation   | Description                                                        |
|------------------|--------------------------------------------------------------------|
| [scrapeHtml](#scrapehtml)      | Extract structured data from HTML using CSS selectors.         |
| [replace](#replace)            | Replace all occurrences of a substring in a string.            |
| [regexReplace](#regexreplace)  | Replace parts of a string using a regular expression.           |
| [regexCompose](#regexcompose)  | Extract and format data using a regex pattern and template.     |
| [typecast](#typecast)          | Cast a value to a specified type (`number` or `string`).        |
| [textToJson](#texttojson)      | Parse a string as JSON.                                        |
| [restructure](#restructure)    | Reshape a JSON object using a template and JSONPath.            |
| [print](#print)                | Print the current value to the console (for debugging).         |
| [count](#count)                | Count elements in an array or characters in a string.           |
| [objectToArray](#objecttoarray)| Convert an object to an array of key-value objects.             |
| [reduce](#reduce)              | Reduce an array to a single value using an operation.           |

---

## Source and destination

Most transformations support `source` and `destination` params. The `source` allows to specify which field of an object to use as input data for the transformation as jsonpath. The `destination` allows to specify in which key to store the result. If `source` is unspecified, the whole data will be used as input. If `destination` is unspecified, it will store the result in the same path as `source`. See usage in the transformation examples below.


## `scrapeHtml`

Extracts structured data from HTML content using CSS selectors.

**Expected type:** `string` (HTML)

**Options:**
- `template`: Object describing the fields to extract using CSS selectors.

**Example:**
```yaml
- name: scrapeHtml
  options:
    template:
      title: h1
      price: .price-current
      features:
        - .feature-item
```

---

## `replace`

Replaces all occurrences of a substring in a string.

**Expected type:** `string`

**Options:**
- `search`: Substring to search for.
- `replaceWith`: Value to replace with.

**Example:**
```yaml
- name: replace
  options:
    search: "$"
    replaceWith: ""
  source: $.price
```
**Input:**
```json
{
  "price": "$19.99"
}
```
**Output:**
```json
{
  "price": "19.99"
}
```

---

## `regexReplace`

Replaces parts of a string using a regular expression.

**Expected type:** `string`

**Options:**
- `pattern`: Regex pattern.
- `output`: Replacement string (can use `$1`, `$2`, ... for groups).

**Example:**
```yaml
- name: regexReplace
  options:
    pattern: "(\\w+) (\\w+)"
    output: "Hello Mr. $2, or should I call you $1 ?"
  source: $.person
  destination: greeting
```
**Input:**
```json
{
  "person": "James Bond"
}
```
**Output:**
```json
{
  "person": "James Bond",
  "greeting": "Hello Mr. Bond, or should I call you James ?"
}
```

---

## `regexCompose`

Extracts and formats data using a regex pattern and output template.

**Expected type:** `string`

**Options:**
- `pattern`: Regex pattern.
- `output`: Output template string.

**Example:**
```yaml
- name: regexCompose
  options:
    pattern: "(\\d+)-(\\w+)"
    output: "ID: $1, Type: $2"
  source: $.code
  destination: formatted
```
**Input:**
```json
{
  "code": "1234-abc"
}
```
**Output:**
```json
{
  "code": "1234-abc",
  "formatted": "ID: 1234, Type: abc"
}
```

---

## `typecast`

Casts a value to a specified type.

**Expected type:** `string` or `number`

**Options:**
- `targetType`: `"number"` or `"string"`

**Example:**
```yaml
- name: typecast
  options:
    targetType: number
  source: $.price
```
**Input:**
```json
{
  "price": "42"
}
```
**Output:**
```json
{
  "price": 42
}
```

---

## `textToJson`

Parses a string as JSON.

**Expected type:** `string`

**Options:** _None_

**Example:**
```yaml
- name: textToJson
  source: $.raw
  destination: parsed
```
**Input:**
```json
{
  "raw": "{ \"foo\": 123, \"bar\": \"baz\" }"
}
```
**Output:**
```json
{
  "raw": "{ \"foo\": 123, \"bar\": \"baz\" }",
  "parsed": { "foo": 123, "bar": "baz" }
}
```

---

## `restructure`

Reshapes a JSON object according to a template using JSONPath.

**Expected type:** `object`

**Options:**
- `template`: Object mapping output fields to JSONPath expressions.

**Example:**
```yaml
- name: restructure
  options:
    template:
      repo:
        name: $.name
        stars: $.stargazers_count
      owner:
        login: $.owner.login
  source: $
  destination: summary
```
**Input:**
```json
{
  "name": "WebDataFetcher",
  "stargazers_count": 123,
  "owner": { "login": "raphael", "type": "User" }
}
```
**Output:**
```json
{
  "name": "WebDataFetcher",
  "stargazers_count": 123,
  "owner": { "login": "raphael", "type": "User" },
  "summary": {
    "repo": {
      "name": "WebDataFetcher",
      "stars": 123
    },
    "owner": {
      "login": "raphael"
    }
  }
}
```

---

## `print`

Prints the current value to the console (for debugging).

**Expected type:** `any`

**Options:** _None_

**Example:**
```yaml
- name: print
  source: $.foo
```
**Input:**
```json
{
  "foo": 123
}
```
**Output:**  
Prints `123` to the console and returns the value unchanged:
```json
{
  "foo": 123
}
```

---

## `count`

Counts the number of elements in an array or characters in a string.

**Expected type:** `string` or `array`

**Options:** _None_

**Example:**
```yaml
- name: count
  source: $.members
  destination: memberCount
```
**Input:**
```json
{
  "members": ["a", "b", "c"]
}
```
**Output:**
```json
{
  "members": ["a", "b", "c"],
  "memberCount": 3
}
```

---

## `objectToArray`

Converts an object to an array of key-value objects.

**Expected type:** `object`

**Options:**
- `keyField`: Name for the key field (default: `"key"`).
- `valueField`: Name for the value field (default: `"value"`).

**Example:**
```yaml
- name: objectToArray
  options:
    keyField: date
    valueField: available
  source: $.data
  destination: dates
```
**Input:**
```json
{
  "data": {
    "2024-06-01": true,
    "2024-06-02": false
  }
}
```
**Output:**
```json
{
  "data": {
    "2024-06-01": true,
    "2024-06-02": false
  },
  "dates": [
    { "date": "2024-06-01", "available": true },
    { "date": "2024-06-02", "available": false }
  ]
}
```

---

## `reduce`

Reduces an array to a single value using an operation.

**Expected type:** `array` (or `string` for `count` operation)

**Options:**
- `operation`: `"sum"`, `"average"`, `"count"`, `"any"`, `"all"`, `"max"`, `"min"`
- `key`: (optional) Field to use within array objects.

**Example:**
```yaml
- name: reduce
  options:
    operation: any
    key: available
  source: $.dates
  destination: anyAvailable
```
**Input:**
```json
{
  "dates": [
    { "date": "2024-06-01", "available": false },
    { "date": "2024-06-02", "available": true }
  ]
}
```
**Output:**
```json
{
  "dates": [
    { "date": "2024-06-01", "available": false },
    { "date": "2024-06-02", "available": true }
  ],
  "anyAvailable": true
}
```

---


## Other ideas of transforms

- CsvToJson : Convert the given CSV to a JSON object
- RenameField : Rename a field
- SimpleEval : Resolves a math operation on one or multiple numeric fiels (`[fieldName] + [fieldName]`)
- Scrape : Scrape the value as HTML, output the json result
- sed : Équivalent of `sed` command line tool
- Dedupe : Remove duplicate enties in an array of data if specified field values match