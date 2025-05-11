# WebDataFetcher

Simple yet flexible web data fetcher that allows you to run scaping jobs periodically to extract data from endpoints and send it to various destinations (database, file, print to console, etc.).

## Features

- Scraping jobs defined in yaml
- Reshaping fetched data with transformation pipeline
- Comprehensive logging
- Scrape not only HTML, but also CSS, JSON and plain text data

## Anatomy of a scraping job

The work of a scraping job is to fetch some data from a specified endpoint, transform it (optional) to shape it the way you need, and send it to one or more destinations (store it to a database, print it to console, etc.).

A scaping job defines:
- A `schedule` : when to run the job
- An `input` : what endpoint to scrape
- One or more `outputs` : where to send the data

It also allows to specify input and outputs transformations that allow you to reshape your data like you want before sending it to the output destinations.

## Destinations

A destination is a place where to send the data, for instance a database. The following destination types are currently available:

- `console` : Print to console
- `influxdb` : InfluxDB v2 time series database
- `victoriaMetrics` : Victoria Metrics database


To use a destination, it must first be configured:

```yaml
# myConfig.yaml

destinations:

  # Console
  myConsole: # Arbitrary destination name
    type: console

  # InfluxDB
  myInfluxdb:
    type: influxdb
    options:
      url: http://influxdb:8086
      token: <your influxdb token>
      organisation: myOrganisation
      bucket: <your destination bucket>

  # Victoria Metrics
  myVictoriaMetrics:
    type: victoriaMetrics
    options:
      url: http://victoriametrics:8428

```

Once defined, they can be used as `outputs` in the scraping jobs. Lets create a job :

```yaml
jobs:
  # Let's track the price of an SSD drive
  ssdPrice: # Arbitrary job name

    # When to run the job
    schedule:
      cron: "0 0 * * *"
    
    # What to fetch
    input:
      url: https://www.newegg.ca/samsung-970-evo-plus-1tb/p/N82E16820147743

      # Transform the data
      transformations:
        
        # Extract the price from the html content
        - name: htmlScrape
          options:
            template:
              price: .price-current # css selector

        # Print the data to console
        - name: print   # We should get : { price: "$159.89" }
        
        # Remove the $ sign
        - name: replace
          target: price # from the "price" value
          options:
            search: $
            replaceWith: ""

        # Print the data to console
        - name: print   # We should get : { price: "159.89" }
        
        # Convert the price to a number
        - name: typecast
          target: price
          options:
            targetType: number

        # Print the data to console
        - name: print   # We should get : { price: 159.89 }

    # Where to send the data
    outputs:
      # Write data to Influxdb v2
      - to: myInfluxdb  # The destination name
        options:
          # InfluxDB specific options (create a point)
          measurement: price
          tags:
            product: "SSD"
            model: "Samsung 1Tb"
          fields:
            price: ${price} # Use json path to specify the target

      # Write data to victoria metrics
      - to: myVictoriaMetrics
        options:
          metrics:
            - name: price
              labels:
                product: "SSD"
                model: "Samsung 1Tb"
              value: ${price}
```


## Transformations

Transformations allow you to manipulate the data. Transformations can be applied at different stages of the scraping job (at the input, before the outputs). The input transformations are applied before the data is sent to the outputs whereas the output transformations are applied just before sending the data to the corresponding output destination. This gives the flexibility to specify different transformations and structure the data properly for each output.

<img src="./img/anatomy-scraping-job.png" alt="anatomy of a scraping job" width="400" />

See [transforms/Readme.md](./src/transforms/Readme.md) for a full list of available transformations and usage examples.



# TODO

- [ ] Capture exceptions during job (ex: if the website changes, some data may be null and some transform will throw exception)
- [ ] Add support for `intFields`, `booleanField` (influxdb destination) ?
- [ ] Implement json path to specify target
- [ ] Support composing new values from multiple source fields using JsonPath expresions in `restructure` transform (ex: `output: "${$.price} - ${$.model}"`)
- [ ] Use brackets with json path for `target` in transformations for more consistency ?
- [x] Add a `disable` option for destinations to disable a specific destination
- [ ] Add a `disable` option for outputs to disable a specific output (in jobs) ?
- [ ] Option to combine the result of multiple requests (and dedupe for a certain key)