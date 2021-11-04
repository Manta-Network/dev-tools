import React, { Component } from 'react';
import './App.css';
import axios from 'axios';


class App extends Component {
    columns = [ 'name', 'id', 'skipped', 'processed', 'total' ];
    state = {
        response: null
    };

    componentDidMount() {
        axios.get('/api/v1/get-data').then((res) => {
            const response = res.data;
            this.setState({response});
        });
    }

    render() {
        if (this.state.response == null) {
            return null;
        }
        const table = this.state.response.body;
        return (
            <div className="App">
                <h1>Block statistics.</h1>
                {
                    Object.keys(table).map((k1,i) => {
                        return (
                            <div key={k1}>
                                <h3>{k1}</h3>
                                <table><tbody>
                                <tr>{this.columns.map((c) => <td key={c}>{c}</td>)}</tr>
                                {
                                    table[k1].map((row) => {
                                        return (
                                            <tr>
                                            {this.columns.map((c) => <td key={c}>{row[c]}</td>)}
                                            </tr>
                                        );
                                    })
                                }
                                </tbody></table>
                            </div>
                        );
                    })
                }
            </div>
        );
    }
}

export default App;
