const express = require('express');
const router = express.Router();
const projects = require('../services/projects');
/* GET projects */
router.get('/', async function(req, res, next) {
    try {
// response a GET request with a JSON format result using res.join
        res.json(await projects.getMultiple(req.query.page));        
    } catch (err) {
        console.error('Error while getting projects ', err.message);
        next(err);
    }
});

/* POST projects */
router.post('/', async function(req, res, next) {
    try {
        res.json(await projects.create(req.body));
    } catch  (err) {
        console.error('Error while creating project', err.message);
    }
});

/* PUT projects */
router.put('/:id', async function(req, res, next){
    try {
        res.json(await projects.update(req.params.id, req.body));
    } catch (err) {
        console.error('Error while updating project', err.message);
        next(err);
    }
});

/* Delete projects */
router.delete('/:id', async function(req, res, next){
    try {
        res.json(await projects.remove(req.params.id));
    } catch (err) {
        console.error('Error while deleting project');
        next(err);
    }
});

/* GET one project */
router.get('/:id', async function(req, res, next){
    try {
        res.json(await projects.getOne(req.params.id));
    } catch (err) {
        console.error('Error while getting project');
        next(err);
    }
});

module.exports = router;