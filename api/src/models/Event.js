const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
    {
        nameAndLastName: {type: String, required: true, trim: true},
        isAssisted: {type: Boolean, required: true},
        methodPayment: {type: String, required: true, trim: true, enum: ['efectivo', 'transferencia', 'no pagos']},
        totalPayment: {type: Number, required: true, min: 0},
        paidAmount: {
            type: Number,
            default: 0,
            min: 0,
            validate: {
                validator(value) {
                    const totalPayment =
                        this instanceof mongoose.Document
                            ? this.totalPayment
                            : this.get('totalPayment');
                    return totalPayment === undefined || value <= totalPayment;
                },
                message: 'El monto abonado no puede superar el total.',
            },
        }
    },
    {
        timestamps: {createdAt: 'creado', updatedAt: 'actualizado'},
        versionKey: false
    }
);

module.exports = mongoose.model('Event', eventSchema);