var Publisher = require('../models/publisher');
var Book = require('../models/book');
var async = require('async');

const { body,validationResult } = require('express-validator');

exports.publisher_list = function(req, res, next) {

    Publisher.find()
      .sort([['name', 'ascending']])
      .exec(function (err, list_publisher) {
        if (err) { return next(err); }
        //Successful, so render
        res.render('publisher_list', { title: 'Publisher List', publisher_list: list_publisher });
      });
  
  };
  exports.publisher_detail = function(req, res, next) {

    async.parallel({
        publisher: function(callback) {
            Publisher.findById(req.params.id)
              .exec(callback);
        },

        publisher_books: function(callback) {
            Book.find({ 'publisher': req.params.id })
              .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.publisher==null) { // No results.
            var err = new Error('publisher not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('publisher_detail', { title: 'Publisher Detail', publisher: results.publisher, publisher_books: results.publisher_books } );
    });

};

// Display publisher create form on GET.
exports.publisher_create_get = function(req, res, next) {
    res.render('publisher_form', { title: 'Create Publisher' });
  };

exports.publisher_create_post =  [

    // Validate and santize the name field.
    body('name', 'Publisher name required').trim().isLength({ min: 1 }).escape(),
  
    // Process request after validation and sanitization.
    (req, res, next) => {
  
      // Extract the validation errors from a request.
      const errors = validationResult(req);
  
      // Create a publisher object with escaped and trimmed data.
      var publisher = new Publisher(
        { name: req.body.name }
      );
  
      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render('publisher_form', { title: 'Create Publisher', publisher: publisher, errors: errors.array()});
        return;
      }
      else {
        // Data from form is valid.
        // Check if publisherwith same name already exists.
        Publisher.findOne({ 'name': req.body.name })
          .exec( function(err, found_publisher) {
             if (err) { return next(err); }
  
             if (found_publisher) {
               // publisher exists, redirect to its detail page.
               res.redirect(found_publisher.url);
             }
             else {
  
                publisher.save(function (err) {
                 if (err) { return next(err); }
                 // publisher saved. Redirect to publisher detail page.
                 res.redirect(publisher.url);
               });
  
             }
  
           });
      }
    }
  ];