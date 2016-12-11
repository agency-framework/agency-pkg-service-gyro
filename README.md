# agency-pkg-service-gyro

> Service-Package for [agency-boilerplate](https://github.com/agency-framework/agency-boilerplate)

## Configation

For set enviroment settings from gyro, use configuration from [**webvr-polyfill**](https://github.com/googlevr/webvr-polyfill#configuration).

`DEFER_INITIALIZATION` must be set to `true`.

> `DEFER_INITIALIZATION: true,`

## Use

```javascript
var gyroService = require('agency-pkg-service-gyro');

// register callback
gyroService.register(function(data){

  // direction (NONE, LEFT, RIGHT)
  console.log(data.direction);

  // normalized xyz
  console.log(data.position);

  // euler xyz
  console.log(data.euler);

});

// reset values
gyroService.reset();

// add offset
gyroService.addOffset(x, y, z);

// set offset
gyroService.offset(x, y, z);
```

## Heroku App Examples

> [**Horizontal-Segments**](https://agency-pkg-gyro.herokuapp.com/horizontal-segments.html)

> [**Compensating-Background Image**](https://agency-pkg-gyro.herokuapp.com/compensating-background/image.html)

> [**Compensating-Background Text**](https://agency-pkg-gyro.herokuapp.com/compensating-background/text.html)
