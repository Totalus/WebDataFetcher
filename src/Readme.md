

# TODO

- [ ] Add support for `intFields`, `booleanField` (influxdb destination) ?
- [ ] Implement json path to specify target
- [ ] Support composing new values from multiple source fields using JsonPath expresions in `restructure` transform (ex: `output: "${$.price} - ${$.model}"`)
- [ ] Use brackets with json path for `target` in transformations for more consistency ?
- [ ] Add a `disable` option for destinations to disable a specific destination
- [ ] Add a `disable` option for outputs to disable a specific output (in jobs) ?

## Transformations

Transformations allow to manipulate the data before it is sent to the output. Transformations can be applied to the input or any of the outputs. The input transformations are applied before the data is sent to the outputs whereas the output transformations are applied just before sending the data to the corresponding output destination. This gives the flexibility to specify different transformations for each output.


### `regexReplace`

```yaml
transformations:
  - name: regexReplace

    # If the input data is in JSON, you need to specify
    # the json path of the value you want to affect
    target: <json path>
 
    options:

      # The regex pattern to match
      pattern: <regex pattern>

      # The output, where you can specify the group matches
      # in the regex pattern by using $1, $2, $3, ...
      output: <output pattern>

# Example
transformations:
  - name: regexReplace
    options:
      pattern: "(\w) (\w)"
      output: "Hello Mr. $2, or should I call you $1 ?"

# Input value:       "James Bond"
# Output value:      "Hello Mr. Bond, or should I call you James ?"
```

This transformation is equivalent to calling `outputValue = inputValue.replace(new RegExp(pattern), output)` in Javascript.

### `replace`

```yaml
transformations:
  - name: replace
  
    # If the input data is in JSON, you need to specify
    # the json path of the value you want to affect
    target: <json path>
    
    # The specific transformation options
    options:

      # The substring to search
      search: <search value>

      # The value to replace the substring with
      replaceWith: <replace with this value>


# Example
transformations:
  - name: replace
    options:
      search: "abc"
      replaceWith: "ABC"

# Input value:       "abcdef abcdef"
# Output value:      "ABCdef ABCdef"
```

This transformation is equivalent to calling `outputValue = inputValue.replaceAll(search, replaceWith)` in Javascript.

### `textToJson`

Converts an text input value to JSON. This is equivalent to calling `outputValue = JSON.parse(inputValue)` in Javascript.

```yaml
transformations:
  - name: textToJson
  
    # You may optionally specify a target if you want to
    # transform a nested string field into json
    target: <json path>

# Example
transformations:
  - name: textToJson

# Input value:       '{ "hello": "world" }'      (text string)
# Output value:       { "hello": "world" }       (json)
```

### `restructure`

This transformation allows you to extract data from a JSON input value and restructure it, changing field names.

```yaml
transformations:
  - name: restructure
    
    # You may optionally specify a target if you want to
    # transform a nested string field into json
    target: <json path>

    options:
      
      # The template represents the new object to create
      # by specifying the outputValue field names and the
      # json path to the value
      template:
        <field name>: <json path>

        # You can also build nested objects
        <field name>:
          <field name>: value

# Example
transformations:
  - name: restructure
    options:
      template:
        contactInfo:
          phone: $.phone
          email: $.email
        name:
          first: $.firstName
          last: $lastName


# Input value:
# {
#    "firstName": "James",
#    "lastName": "Bond",
#    "address": "123 A Street"
#    "phone": "111-111-1111"
#    "email": "james.bond@mi6.gov"
# }
#
# Output value:
# {
#     "contactInfo": {
#       "phone": "111-111-111"
#       "email": "james.bond@mi6.gov"
#     },
#     "name": {
#       "first": "James",
#       "last": "Bond"
#     }
# }
#
```


## Other ideas of transforms

- Restructure : Allows to completely restructure the data
- CsvToJson : Convert the given CSV to a JSON object
- RenameField : Rename a field
- SimpleEval : Resolves a math operation on one or multiple numeric fiels (`[fieldName] + [fieldName]`)
- Scrape : Scrape the value as HTML, output the json result